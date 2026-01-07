#!/usr/bin/env python3
# worker/worker.py
import os
import time
import json
from datetime import datetime
from dotenv import load_dotenv

import redis
from pymongo import MongoClient
import cv2
import numpy as np

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/clgmega_dev')
FRAME_COLLECTION = os.getenv('FRAME_COLLECTION', 'frames')
EVENT_COLLECTION = os.getenv('EVENT_COLLECTION', 'events')
ANNOTATED_SUFFIX = '_det.jpg'

print("Worker starting. Redis:", REDIS_URL, "Mongo:", MONGO_URI)

# Redis client (blocking pop)
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# Mongo client
mongo = MongoClient(MONGO_URI)
db = mongo.get_default_database()
frames_col = db[FRAME_COLLECTION]
events_col = db[EVENT_COLLECTION]

# Load OpenCV Haarcascade
haar_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(haar_path)
if face_cascade.empty():
    raise RuntimeError("Failed to load Haar cascade at: " + haar_path)

def safe_read_image(file_path):
    try:
        img = cv2.imdecode(np.fromfile(file_path, dtype=np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            img = cv2.imread(file_path)
        return img
    except Exception as e:
        print("Error reading image:", e)
        return None

def process_frame(frame_doc):
    file_path = frame_doc.get('filePath')
    if not file_path or not os.path.exists(file_path):
        print("Missing frame file:", file_path)
        frames_col.update_one({"frameId": frame_doc.get("frameId")}, {"$set": {"status": "error"}})
        return

    img = safe_read_image(file_path)
    if img is None:
        print("Could not load image for:", file_path)
        frames_col.update_one({"frameId": frame_doc.get("frameId")}, {"$set": {"status": "error"}})
        return

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30,30))
    faces_count = len(faces)
    print(f"[{datetime.utcnow().isoformat()}] frameId={frame_doc.get('frameId')} faces={faces_count}")

    # Annotate and save annotated image
    annotated_path = None
    try:
        for (x,y,w,h) in faces:
            cv2.rectangle(img, (x,y), (x+w,y+h), (0,255,0), 2)
        annotated_path = file_path.replace('.jpg', ANNOTATED_SUFFIX)
        cv2.imwrite(annotated_path, img)
    except Exception as e:
        print("Failed to write annotated image:", e)
        annotated_path = None

    # Create event based on face count
    event_id = None
    event_doc = None

    if faces_count == 0 or faces_count >= 2:
        # Map to public URL served by backend: /frames/<basename>
        frame_basename = os.path.basename(annotated_path or file_path)
        public_frame_path = '/frames/' + frame_basename

        event_type = 'no_face' if faces_count == 0 else 'multi_face'
        severity = 'medium' if faces_count == 0 else 'high'
        event_doc = {
            "sessionId": frame_doc.get("sessionId"),
            "studentId": frame_doc.get("studentId"),
            "frameId": frame_doc.get("frameId"),
            "type": event_type,
            "severity": severity,
            "timestampStart": frame_doc.get("timestamp", datetime.utcnow()),
            "timestampEnd": datetime.utcnow(),
            "framePath": public_frame_path,
            "modelConfidence": None,
            "reviewed": False,
            "reviewDecision": "pending",
            "notes": "Auto-detected: " + ("no face" if faces_count == 0 else "multiple faces")
        }
        try:
            res = events_col.insert_one(event_doc)
            event_id = res.inserted_id
            print("Created event:", event_id)
        except Exception as e:
            print("Failed to insert event:", e)
            event_id = None

        # Notify backend internal endpoint
        if event_id:
            try:
                import requests
                backend_url = os.getenv('BACKEND_INTERNAL_URL', 'http://localhost:4000/internal/event')
                internal_secret = os.getenv('INTERNAL_SECRET', '')
                payload = dict(event_doc)
                payload['_id'] = str(event_id)
                headers = {'Content-Type': 'application/json', 'x-internal-secret': internal_secret}
                r = requests.post(backend_url, json=payload, headers=headers, timeout=5)
                if r.status_code == 200:
                    print("Notified backend of event")
                else:
                    print("Backend notify failed:", r.status_code, r.text)
            except Exception as e:
                print("Failed to notify backend:", e)

    # Update frame status
    update = {"status": "processed", "processedAt": datetime.utcnow()}
    if event_id:
        update["eventId"] = event_id
    frames_col.update_one({"frameId": frame_doc.get("frameId")}, {"$set": update})
    print("Frame updated, frameId:", frame_doc.get("frameId"))

def main_loop():
    print("Worker main loop. Waiting for jobs on 'frame_queue' ...")
    while True:
        try:
            item = r.brpop('frame_queue', timeout=5)  # returns (listname, value) or None
            if not item:
                # no job, loop
                continue
            _, job_json = item
            try:
                job = json.loads(job_json)
            except Exception:
                print("Invalid job json:", job_json)
                continue
            frame_id = job.get('frameId')
            if not frame_id:
                print("Job missing frameId:", job)
                continue

            frame_doc = frames_col.find_one({"frameId": frame_id})
            if not frame_doc:
                print("No frame doc for frameId:", frame_id)
                continue

            # mark processing
            frames_col.update_one({"frameId": frame_id}, {"$set": {"status": "processing", "processingAt": datetime.utcnow()}})

            # process it
            process_frame(frame_doc)

        except Exception as e:
            print("Worker loop error:", e)
            time.sleep(1)

if __name__ == "__main__":
    main_loop()
