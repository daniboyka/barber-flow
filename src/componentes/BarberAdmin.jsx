import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Asegúrate de que la ruta sea correcta

const ALL_HOURS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const BarberAdmin = () => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration: "",
  });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [blockedList, setBlockedList] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  // 1. Obtén las horas de los turnos ya reservados para el día seleccionado
  const reservedByClients = appointments
    .filter((app) => app.date === selectedDate) // 'selectedDate' es el valor del input tipo date
    .map((app) => app.time); // O 'app.hour', como se llame en tu tabla 'appointments'

  // Cargar bloqueos al cambiar de fecha
  useEffect(() => {
    fetchBlockedShifts();
  }, [selectedDate]);

  const fetchBlockedShifts = async () => {
    const { data } = await supabase
      .from("blocked_shifts")
      .select("*")
      .eq("date", selectedDate);
    setBlockedList(data.map((b) => b.time));
  };

  const toggleBlockShift = async (hora) => {
    // CAMBIO AQUÍ: Usamos 'reservedByClients' que es la variable que sí tenés definida arriba
    if (reservedByClients.includes(hora)) {
      alert(
        "Este horario tiene un turno reservado por un cliente y no puede modificarse desde aquí.",
      );
      return;
    }

    if (blockedList.includes(hora)) {
      // Desbloquear
      await supabase
        .from("blocked_shifts")
        .delete()
        .eq("date", selectedDate)
        .eq("time", hora);
    } else {
      // Bloquear
      await supabase
        .from("blocked_shifts")
        .insert([{ date: selectedDate, time: hora, reason: "Manual" }]);
    }
    fetchBlockedShifts(); // Refrescar lista
  };

  const fetchAdminData = async () => {
    setLoading(true);
    // Traemos turnos y servicios en paralelo
    const [appsRes, servRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: true }),
      supabase.from("services").select("*").order("name", { ascending: true }),
    ]);

    if (!appsRes.error) setAppointments(appsRes.data);
    if (!servRes.error) setServices(servRes.data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="text-center p-10">Cargando panel...</div>;

  const deleteService = async (id) => {
    const confirmacion = window.confirm(
      "¿Estás seguro de que querés eliminar este servicio?",
    );
    if (!confirmacion) return;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      alert("Error al borrar: " + error.message);
    } else {
      // Actualizamos la lista local para que desaparezca al toque
      setServices(services.filter((s) => s.id !== id));
    }
  };

  // Función para guardar el servicio
  const handleAddService = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("services")
      .insert([
        {
          name: newService.name,
          price: parseInt(newService.price),
          duration: parseInt(newService.duration),
        },
      ])
      .select();

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      setServices([...services, data[0]]); // Lo sumamos a la lista sin recargar
      setNewService({ name: "", price: "", duration: "" }); // Limpiamos campos
      setShowForm(false); // Cerramos formulario
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      {/* Header Admin */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SECCIÓN 1: PRÓXIMOS TURNOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            📅 Turnos del día
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
              {/* Contamos solo los turnos del día seleccionado */}
              {appointments.filter((app) => app.date === selectedDate).length}
            </span>
          </h2>

          <div className="space-y-4">
            {/* Filtramos el array antes de recorrerlo */}
            {appointments.filter((app) => app.date === selectedDate).length ===
            0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm italic">
                  No hay turnos para esta fecha.
                </p>
              </div>
            ) : (
              appointments
                .filter((app) => app.date === selectedDate)
                .map((app) => (
                  <div
                    key={app.id}
                    className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-slate-800 capitalize leading-none mb-1">
                          {app.client_name || "Cliente"}
                        </p>
                        <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">
                          {app.date} • {app.time}hs
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {app.service_name}
                        </p>
                      </div>
                      {/* Botón para borrar/finalizar turno */}
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              "¿Marcar como finalizado? Se borrará de la lista.",
                            )
                          ) {
                            const { error } = await supabase
                              .from("appointments")
                              .delete()
                              .eq("id", app.id);
                            if (!error) fetchAdminData();
                          }
                        }}
                        className="text-slate-300 hover:text-red-500 p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Botón rápido de WhatsApp para el Barbero */}
                    <a
                      href={`https://wa.me/549${app.client_phone?.replace(/\D/g, "").replace(/^54/, "").replace(/^9/, "").replace(/^15/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.735-.981z" />
                      </svg>
                      MENSAJEAR CLIENTE
                    </a>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* SECCIÓN 2: GESTIÓN DE SERVICIOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">✂️ Servicios</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                showForm
                  ? "bg-slate-200 text-slate-600"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {showForm ? "Cancelar" : "+ Nuevo"}
            </button>
          </div>
          {/* Formulario para Nuevo Servicio */}
          {showForm && (
            <form
              onSubmit={handleAddService}
              className="mb-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-in fade-in zoom-in duration-200"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: Corte + Barba)"
                  className="w-full p-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService({ ...newService, name: e.target.value })
                  }
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Precio ($)"
                    className="w-1/2 p-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Minutos (min)"
                    className="w-1/2 p-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
                    value={newService.duration}
                    onChange={(e) =>
                      setNewService({ ...newService, duration: e.target.value })
                    }
                    required
                  />
                </div>
                <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700">
                  GUARDAR SERVICIO
                </button>
              </div>
            </form>
          )}
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-center p-3 border border-slate-100 rounded-xl"
              >
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {service.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    ${service.price} • {service.duration} min
                  </p>
                </div>
                <button
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  onClick={() => deleteService(service.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold mb-4">🗓️ Gestionar Horarios</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
              }
              className="px-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
            >
              Hoy
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ALL_HOURS.map((hora) => {
              const isManualBlocked = blockedList.includes(hora);
              const isReserved = reservedByClients.includes(hora);
              const isOccupied = isManualBlocked || isReserved;

              return (
                <button
                  key={hora}
                  // 1. Agregamos disabled para que el navegador bloquee el click físicamente
                  disabled={isReserved}
                  onClick={() => toggleBlockShift(hora)}
                  className={`p-2 rounded-lg border-2 font-bold text-xs transition-all ${
                    isOccupied
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-slate-50 border-slate-100 text-slate-600"
                  } ${isReserved ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  {hora} {isOccupied ? "🚫" : "✅"}
                  {isReserved && (
                    <span className="block text-[8px] uppercase">Cliente</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[10px] text-slate-400 italic">
            * Los horarios en rojo no aparecerán disponibles para los clientes.
          </p>
        </section>
      </main>
    </div>
  );
};

export default BarberAdmin;
