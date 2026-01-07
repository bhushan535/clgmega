import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function TeacherClasses() {
  const nav = useNavigate();
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({ name:"", code:"", description:"" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadClasses(); }, []);

  async function loadClasses() {
    const res = await api.get("/teacher/classes");
    setClasses(res.data.classes || []);
  }

  async function createClass(e) {
    e.preventDefault();
    setCreating(true);
    await api.post("/classes", newClass);
    setNewClass({ name:"", code:"", description:"" });
    setCreating(false);
    loadClasses();
  }

  async function deleteClass(id) {
    if (!confirm("Delete class?")) return;
    await api.delete(`/classes/${id}`);
    loadClasses();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Classes</h2>

      <h3>Create Class</h3>
      <form onSubmit={createClass}>
        <input placeholder="Name" value={newClass.name}
          onChange={e=>setNewClass({...newClass,name:e.target.value})} required />
        <input placeholder="Code" value={newClass.code}
          onChange={e=>setNewClass({...newClass,code:e.target.value})} required />
        <input placeholder="Description" value={newClass.description}
          onChange={e=>setNewClass({...newClass,description:e.target.value})} />
        <button disabled={creating}>
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      <h3 style={{ marginTop:20 }}>Your Classes</h3>
      <ul>
        {classes.map(c => (
          <li key={c._id}>
            <b>{c.name}</b> ({c.code})
            <button onClick={() => nav(`/teacher/classes/${c._id}`)} style={{ marginLeft:8 }}>
              Manage
            </button>
            <button onClick={() => deleteClass(c._id)} style={{ marginLeft:8, color:"red" }}>
              Delete
            </button>
          </li>
        ))}
        {classes.length === 0 && <li>No classes</li>}
      </ul>
    </div>
  );
}
