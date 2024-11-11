import React from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

const Observaciones = ({ tratamientoSeleccionado, onTratamientoChange }) => {
  const handleChange = (event) => {
    const { value } = event.target;
    onTratamientoChange(value); // Llamar a la función de actualización
  };

  return (
    <div>
      <h4>Seleccione las observaciones del presupuesto:</h4>
      <FormControl fullWidth>
        <Select
          labelId="tratamiento-label"
          id="tratamiento"
          value={tratamientoSeleccionado}
          onChange={handleChange}
        >
          <MenuItem value="tratamiento1">Tratamiento 1</MenuItem>
          <MenuItem value="tratamiento2">Tratamiento 2</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
};

export default Observaciones;



