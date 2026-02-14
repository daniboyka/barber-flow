import { createContext, useState } from 'react';

// 1. Creamos el contexto
export const AppointmentContext = createContext();

// 2. Creamos el proveedor
export const AppointmentProvider = ({ children }) => {
  const [appointment, setAppointment] = useState({
    service: null, // Aquí guardaremos el objeto del servicio (nombre, precio, etc)
    date: null,
    time: null,
    client: { name: '', phone: '' }
  });

  const updateAppointment = (newData) => {
    setAppointment((prev) => ({ ...prev, ...newData }));
  };
console.log('Estado del AppointmentContext:', appointment); // Debug para ver el estado en cada render
  return (
    <AppointmentContext.Provider value={{ appointment, updateAppointment }}>
      {children}
    </AppointmentContext.Provider>
  );
};