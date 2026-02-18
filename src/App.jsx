import { useContext, useState, useEffect } from "react";
import { AppointmentContext } from "./context/AppointmentContext";
import { supabase } from "./supabaseClient";
import Login from "./componentes/Login";
import BarberAdmin from "./componentes/BarberAdmin";

const ALL_HOURS = ["09:00", "10:00", "11:00", "12:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

function App() {
  const { appointment, updateAppointment, resetAppointment } =
    useContext(AppointmentContext);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [occupiedTimes, setOccupiedTimes] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // 1. Manejo de Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Cargar Servicios
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

  // 3. Cargar Horarios Ocupados y bloqueos
  useEffect(() => {
    const fetchOccupiedAndBlocked = async () => {
      if (!appointment.date) return;

      // 1. Traer turnos ocupados
      const { data: appointments } = await supabase
        .from("appointments")
        .select("time")
        .eq("date", appointment.date);

      // 2. Traer horarios bloqueados por el barbero
      const { data: blocked } = await supabase
        .from("blocked_shifts")
        .select("time")
        .eq("date", appointment.date);

      // Combinamos ambos en una sola lista de "no disponibles"
      const allUnavailable = [
        ...(appointments?.map((a) => a.time) || []),
        ...(blocked?.map((b) => b.time) || []),
      ];

      setOccupiedTimes(allUnavailable);
    };

    fetchOccupiedAndBlocked();
  }, [appointment.date]);

  // Lógica de navegación y guardado
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
      const { data: existing } = await supabase
        .from("appointments")
        .select("id")
        .eq("date", appointment.date)
        .eq("time", appointment.time);

      if (existing.length > 0) {
        alert("Lo sentimos, este horario se acaba de ocupar.");
        setIsSubmitting(false);
        return;
      }

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
      setStep(4);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsApp = () => {
    const phone = "5493442528201"; //<----- aca se agrega el numero de telefono del peluquero.
    const message = `¡Hola! Acabo de reservar un turno:
🪒 *Servicio:* ${appointment.service?.name}
📅 *Fecha:* ${appointment.date}
⏰ *Hora:* ${appointment.time} hs
👤 *Nombre:* ${appointment.client.name}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // --- RENDERIZADO CON CONDICIONALES ---

  if (session) {
    return <BarberAdmin />;
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Login />
        <button
          onClick={() => setShowLogin(false)}
          className="mb-10 text-slate-400 text-xs font-bold hover:text-indigo-600 transition-colors uppercase tracking-widest"
        >
          ← Volver a la barbería
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="p-4 pb-10 flex-grow">
        {/* HEADER */}
        <header className="max-w-md mx-auto mb-8 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 text-white font-black text-[10px] text-center leading-tight">
              TU
              <br />
              LOGO
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
          <button className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
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

        {/* PASOS */}
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
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h1 className="text-2xl font-bold text-slate-800 mb-6">
                ¿Qué servicio buscás hoy?
              </h1>
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
            </div>
          )}

          {step === 2 && (
            /* ... (Mismo código que tenías para el Paso 2) ... */
            <div className="bg-white p-6 rounded-2xl shadow-sm animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-indigo-600 text-sm font-bold flex items-center gap-1"
                >
                  ← Volver
                </button>
                <button
                  onClick={handleFullReset}
                  className="text-slate-400 text-[11px] font-bold uppercase tracking-wider"
                >
                  Reiniciar
                </button>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Elegí el día y hora
              </h2>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => updateAppointment({ date: e.target.value })}
                className="w-full p-3 border-2 border-slate-200 rounded-xl mb-6 outline-none"
              />
              <div className="grid grid-cols-3 gap-2 mb-6">
                {ALL_HOURS.map((hora) => (
                  <button
                    key={hora}
                    disabled={!appointment.date || occupiedTimes.includes(hora)}
                    onClick={() => updateAppointment({ time: hora })}
                    className={`p-2 rounded-lg border-2 font-semibold transition-all ${
                      occupiedTimes.includes(hora)
                        ? "bg-slate-100 text-slate-400 border-transparent"
                        : appointment.time === hora
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                          : "bg-slate-50 border-slate-100 text-slate-600"
                    }`}
                  >
                    {hora}
                  </button>
                ))}
              </div>
              <button
                disabled={!appointment.date || !appointment.time}
                onClick={() => setStep(3)}
                className={`w-full p-4 rounded-xl font-bold text-white transition-all ${appointment.date && appointment.time ? "bg-indigo-600 shadow-lg" : "bg-slate-300"}`}
              >
                Confirmar Datos
              </button>
            </div>
          )}

          {step === 3 && (
            /* ... (Mismo código que tenías para el Paso 3) ... */
            <div className="bg-white p-6 rounded-2xl shadow-sm animate-in zoom-in duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Tus datos
              </h2>
              <input
                type="text"
                placeholder="Tu nombre"
                value={appointment.client.name}
                onChange={(e) =>
                  updateAppointment({
                    client: { ...appointment.client, name: e.target.value },
                  })
                }
                className="w-full p-3 border-2 border-slate-200 rounded-xl mb-4 outline-none focus:border-indigo-500"
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
                className="w-full p-3 border-2 border-slate-200 rounded-xl mb-6 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleFinalize}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-xl font-bold text-white shadow-lg ${isSubmitting ? "bg-slate-400" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isSubmitting ? "Guardando..." : "Finalizar Reserva"}
              </button>
            </div>
          )}

          {step === 4 && (
            /* ... (Mismo código que tenías para el Paso 4) ... */
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center animate-in zoom-in duration-500">
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                ¡Reserva Lista!
              </h2>
              <p className="text-slate-500 mb-6">
                Genial{" "}
                <span className="font-bold text-indigo-600">
                  {appointment.client.name}
                </span>
                , ya tenés tu turno.
              </p>
              <button
                onClick={sendWhatsApp}
                className="w-full bg-[#25D366] text-white font-bold p-4 rounded-xl mb-3 flex items-center justify-center gap-2"
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
          )}
        </main>
      </div>

      {/* FOOTER - ACCESO ADMIN */}
      <footer className="py-10 text-center">
        <button
          onClick={() => setShowLogin(true)}
          className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-[3px] font-bold"
        >
          Acceso Administración
        </button>
      </footer>
    </div>
  );
}

export default App;
