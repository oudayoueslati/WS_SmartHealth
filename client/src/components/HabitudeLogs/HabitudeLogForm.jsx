import React, { useEffect, useState } from "react";
import { createHabitudeLog, updateHabitudeLog } from "../../api/habitudeLogsApi";

const HabitudeLogForm = ({ onSuccess, selected }) => {
  const [form, setForm] = useState({
    type: "HabitudeLog",
    date: "",
    value: "",
    habitId: "",
    userId: "",
  });

  useEffect(() => {
    if (selected)
      setForm({
        type: selected.type?.value || "HabitudeLog",
        date: selected.date?.value || "",
        value: selected.value?.value || "",
        habitId: selected.habitId?.value?.split("#")[1] || "",
        userId: selected.userId?.value?.split("#")[1] || "",
      });
  }, [selected]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected) await updateHabitudeLog(selected.log?.value.split("#")[1], form);
    else await createHabitudeLog(form);
    onSuccess();
    setForm({ type: "HabitudeLog", date: "", value: "", habitId: "", userId: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{selected ? "Modifier" : "Créer"} un Log</h3>
      <input name="type" value={form.type} onChange={handleChange} placeholder="Type" />
      <input name="date" type="datetime-local" value={form.date} onChange={handleChange} />
      <input name="value" value={form.value} onChange={handleChange} placeholder="Valeur" />
      <input name="habitId" value={form.habitId} onChange={handleChange} placeholder="Habit ID" />
      <input name="userId" value={form.userId} onChange={handleChange} placeholder="User ID" />
      <button type="submit">✅ {selected ? "Mettre à jour" : "Ajouter"}</button>
    </form>
  );
};

export default HabitudeLogForm;
