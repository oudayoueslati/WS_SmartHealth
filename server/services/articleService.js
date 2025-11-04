let articles = [];

export const getArticles = () => articles;

export const addArticle = (data) => {
  const newArt = { 
    ...data, 
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  articles.push(newArt);
  return newArt;
};

export const deleteArticle = (id) => {
  articles = articles.filter((a) => a.id !== id);
};

export const updateArticle = (id, data) => {
  articles = articles.map((a) => (a.id === id ? { ...a, ...data } : a));
};

// For CommonJS (if you're using require instead of import)
module.exports = {
  getArticles,
  addArticle, 
  deleteArticle,
  updateArticle
};