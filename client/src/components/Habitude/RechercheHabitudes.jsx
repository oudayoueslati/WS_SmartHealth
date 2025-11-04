import React, { useState } from 'react';

const RechercheHabitudes = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="recherche-habitudes">
      <input
        type="text"
        placeholder="Rechercher des habitudes..."
        value={searchTerm}
        onChange={handleSearch}
        className="search-input"
      />
    </div>
  );
};

export default RechercheHabitudes;