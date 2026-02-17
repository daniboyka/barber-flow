import { createContext, useState, useEffect } from 'react';

export const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const [appointment, setAppointment] = useState(() => {
    const saved = localStorage.getItem('barber_appointment');
    return saved ? JSON.parse(saved) : {
      service: null,
      date: null,
      time: null,
      client: { name: '', phone: '' }
    };
  });

  useEffect(() => {
    localStorage.setItem('barber_appointment', JSON.stringify(appointment));
  }, [appointment]);

  const updateAppointment = (newData) => {
    setAppointment((prev) => ({ ...prev, ...newData }));
  };

  const resetAppointment = () => {
    localStorage.removeItem('barber_appointment');
    setAppointment({
      service: null,
      date: null,
      time: null,
      client: { name: '', phone: '' }
    });
  };

  return (
    <AppointmentContext.Provider value={{ appointment, updateAppointment, resetAppointment }}>
      {children}
    </AppointmentContext.Provider>
  );
};