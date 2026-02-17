import { useContext, useState, useEffect } from "react";
import { AppointmentContext } from "./context/AppointmentContext";
import { supabase } from "./supabaseClient";

const ALL_HOURS = ["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"];

function App() {
  const { appointment, updateAppointment, resetAppointment } =
    useContext(AppointmentContext);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [occupiedTimes, setOccupiedTimes] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Cargar Servicios
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("price", { ascending: true });

      if (error) console.error("Error cargando servicios:", error);
      else setServices(data);
      setIsLoadingServices(false);
    };
    fetchServices();
  }, []);

  // Cargar Horarios Ocupados
  useEffect(() => {
    const fetchOccupiedTimes = async () => {
      if (!appointment.date) return;
      const { data, error } = await supabase
        .from("appointments")
        .select("time")
        .eq("date", appointment.date);

      if (error) console.error("Error al cargar horarios:", error);
      else setOccupiedTimes(data.map((item) => item.time));
    };
    fetchOccupiedTimes();
  }, [appointment.date]);

  const handleFullReset = () => {
    resetAppointment();
    setStep(1);
  };

  const handleFinalize = async () => {
    if (!appointment.client.name || !appointment.client.phone) {
      alert("Por favor, completá tu nombre y teléfono");
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificación de disponibilidad de último segundo
      const { data: existing, error: checkError } = await supabase
        .from("appointments")
        .select("id")
        .eq("date", appointment.date)
        .eq("time", appointment.time);

      if (checkError) throw checkError;
      if (existing.length > 0) {
        alert("Lo sentimos, este horario se acaba de ocupar.");
        setIsSubmitting(false);
        return;
      }

      // Inserción
      const { error: insertError } = await supabase
        .from("appointments")
        .insert([
          {
            service_name: appointment.service?.name,
            date: appointment.date,
            time: appointment.time,
            client_name: appointment.client.name,
            client_phone: appointment.client.phone,
          },
        ]);

      if (insertError) throw insertError;

      setStep(4); // Ir a pantalla de éxito
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsApp = () => {
    const phone = "5493442528201";
    const message = `¡Hola! Acabo de reservar un turno:
🪒 *Servicio:* ${appointment.service?.name}
📅 *Fecha:* ${appointment.date}
⏰ *Hora:* ${appointment.time} hs
👤 *Nombre:* ${appointment.client.name}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pb-20">
      {/* HEADER COMÚN */}
      <header className="max-w-md mx-auto mb-8 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
            <span className="text-white font-black text-[10px] text-center leading-tight">
              TU
              <br />
              LOGO
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Barbería Elite
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                Disponible
              </span>
            </div>
          </div>
        </div>

        {/* Menú Hamburguesa recuperado */}
        <button className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9h16.5m-16.5 6.75h16.5"
            />
          </svg>
        </button>
      </header>
      {/* INDICADOR DE PASOS (Se oculta en el paso 4 de éxito) */}
      {step < 4 && (
        <div className="max-w-md mx-auto mb-8 flex justify-between text-xs font-bold text-slate-400">
          <span className={step >= 1 ? "text-indigo-600" : ""}>
            1. SERVICIO
          </span>
          <span className={step >= 2 ? "text-indigo-600" : ""}>2. FECHA</span>
          <span className={step >= 3 ? "text-indigo-600" : ""}>3. DATOS</span>
        </div>
      )}

      <main className="max-w-md mx-auto">
        {/* PASO 1: SERVICIOS */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">
              ¿Qué servicio buscás hoy?
            </h1>
            {services.length === 0 && !isLoadingServices ? (
              <div className="text-center p-10 text-slate-500 bg-white rounded-xl">
                No hay servicios cargados en la base de datos.
              </div>
            ) : (
              <>
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => updateAppointment({ service })}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left mb-3 ${
                      appointment.service?.id === service.id
                        ? "border-indigo-600 bg-indigo-50 shadow-md"
                        : "border-white bg-white shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">
                        {service.name}
                      </span>
                      <span className="text-indigo-600 font-bold">
                        ${service.price}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {service.duration} min
                    </p>
                  </button>
                ))}
                <button
                  disabled={!appointment.service}
                  onClick={() => setStep(2)}
                  className={`w-full mt-6 p-4 rounded-xl font-bold text-white transition-all ${
                    appointment.service
                      ? "bg-indigo-600 shadow-lg"
                      : "bg-slate-300"
                  }`}
                >
                  Continuar a Fecha
                </button>
              </>
            )}
          </div>
        )}

        {/* PASO 2: FECHA Y HORA */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setStep(step - 1)}
                className="text-indigo-600 text-sm font-bold hover:underline transition-all flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
                Volver
              </button>

              {/* Botón de reinicio directo con efecto de rotación */}
              <button
                onClick={handleFullReset}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                title="Reiniciar reserva (sin confirmación)"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Reiniciar
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Elegí el día y hora
            </h2>
            <p className="text-slate-500 mb-6 italic border-l-4 border-indigo-500 pl-3">
              Reservando:{" "}
              <span className="font-bold text-slate-700">
                {appointment.service?.name}
              </span>
            </p>

            <div className="space-y-6">
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => updateAppointment({ date: e.target.value })}
                className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none"
              />

              <div className="grid grid-cols-3 gap-2">
                {ALL_HOURS.map((hora) => {
                  const isOccupied = occupiedTimes.includes(hora);
                  return (
                    <button
                      key={hora}
                      disabled={!appointment.date || isOccupied}
                      onClick={() => updateAppointment({ time: hora })}
                      className={`p-2 rounded-lg border-2 font-semibold transition-all ${
                        isOccupied
                          ? "bg-slate-100 text-slate-400 border-transparent cursor-not-allowed"
                          : appointment.time === hora
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                            : "bg-slate-50 border-slate-100 text-slate-600"
                      }`}
                    >
                      {hora}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!appointment.date || !appointment.time}
                onClick={() => setStep(3)}
                className={`w-full p-4 rounded-xl font-bold text-white transition-all ${
                  appointment.date && appointment.time
                    ? "bg-indigo-600 shadow-lg"
                    : "bg-slate-300"
                }`}
              >
                Confirmar Datos
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: DATOS CLIENTE */}
        {step === 3 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setStep(step - 1)}
                className="text-indigo-600 text-sm font-bold hover:underline transition-all flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
                Volver
              </button>

              {/* Botón de reinicio directo con efecto de rotación */}
              <button
                onClick={handleFullReset}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                title="Reiniciar reserva (sin confirmación)"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Reiniciar
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Tus datos
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={appointment.client.name}
                onChange={(e) =>
                  updateAppointment({
                    client: { ...appointment.client, name: e.target.value },
                  })
                }
                className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
              <input
                type="tel"
                placeholder="Tu teléfono"
                value={appointment.client.phone}
                onChange={(e) =>
                  updateAppointment({
                    client: { ...appointment.client, phone: e.target.value },
                  })
                }
                className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleFinalize}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-xl font-bold text-white shadow-lg ${
                  isSubmitting
                    ? "bg-slate-400"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "Guardando..." : "Finalizar Reserva"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: ÉXITO */}
        {step === 4 && (
          <div className="bg-white p-8 rounded-3xl shadow-xl text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              ¡Reserva Lista!
            </h2>
            <p className="text-slate-500 mb-6">
              Genial{" "}
              <span className="font-bold text-indigo-600 capitalize">
                {appointment.client.name}
              </span>
              , tu turno está agendado.
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left space-y-3 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Servicio:</span>
                <span className="font-bold">{appointment.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Fecha:</span>
                <span className="font-bold">
                  {appointment.date} • {appointment.time} hs
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={sendWhatsApp}
                className="w-full bg-[#25D366] text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2"
              >
                Avisar por WhatsApp
              </button>
              <button
                onClick={handleFullReset}
                className="w-full text-slate-400 font-bold p-4"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}
      </main>

      {/* DEBUG (Opcional) */}
      <div className="max-w-md mx-auto mt-10 p-4 bg-slate-800 text-white rounded-lg text-[10px] font-mono opacity-50">
        Paso: {step} | {JSON.stringify(appointment.client)}
      </div>
    </div>
  );
}

export default App;
