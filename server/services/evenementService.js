let evenements = [];

export const getEvenements = () => evenements;

export const addEvenement = (data) => {
  const newEvt = { ...data, id: Date.now() };
  evenements.push(newEvt);
  return newEvt;
};

export const deleteEvenement = (id) => {
  evenements = evenements.filter((e) => e.id !== id);
};

export const updateEvenement = (id, data) => {
  evenements = evenements.map((e) => (e.id === id ? { ...e, ...data } : e));
};
