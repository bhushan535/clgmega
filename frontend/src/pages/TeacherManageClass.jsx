import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function TeacherManageClass() {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({ name:"", enrollment:"", password:"" });
  const [bulkText, setBulkText] = useState("");

  useEffect(() => { loadStudents(); }, [classId]);

  async function loadStudents() {
    const res = await api.get(`/classes/${classId}/students`);
    setStudents(res.data.students || []);
  }

  async function addStudent(e) {
    e.preventDefault();
    await api.post(`/classes/${classId}/students`, studentForm);
    setStudentForm({ name:"", enrollment:"", password:"" });
    loadStudents();
  }

  async function addBulk() {
    const students = bulkText.split("\n").map(l => {
      const [enrollment, password, name] = l.split(",");
      return { enrollment, password, name };
    });
    await api.post(`/classes/${classId}/students`, { students });
    setBulkText("");
    loadStudents();
  }

  async function deleteStudent(id) {
    if (!confirm("Delete student?")) return;
    await api.delete(`/classes/${classId}/students/${id}`);
    loadStudents();
  }

  return (
    <div style={{ padding:20 }}>
      <h2>Manage Class</h2>

      <h3>Add Student</h3>
      <form onSubmit={addStudent}>
        <input placeholder="Enrollment" value={studentForm.enrollment}
          onChange={e=>setStudentForm({...studentForm,enrollment:e.target.value})} />
        <input placeholder="Name" value={studentForm.name}
          onChange={e=>setStudentForm({...studentForm,name:e.target.value})} />
        <input placeholder="Password" value={studentForm.password}
          onChange={e=>setStudentForm({...studentForm,password:e.target.value})} />
        <button>Add</button>
      </form>

      <h3>Bulk Add</h3>
      <textarea rows={5} value={bulkText} onChange={e=>setBulkText(e.target.value)} />
      <button onClick={addBulk}>Add Bulk</button>

      <h3>Students</h3>
      <ul>
        {students.map(s => (
          <li key={s._id}>
            {s.studentId} - {s.name}
            <button onClick={() => deleteStudent(s._id)} style={{ marginLeft:8 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
