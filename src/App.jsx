import { useContext, useState } from "react"; // Agregamos useState
import { AppointmentContext } from "./context/AppointmentContext";

const SERVICES = [
  { id: 1, name: "Corte de Pelo", price: 5000, duration: 30 },
  { id: 2, name: "Barba", price: 3000, duration: 20 },
  { id: 3, name: "Combo Full", price: 7000, duration: 50 },
];

function App() {
  const { appointment, updateAppointment } = useContext(AppointmentContext);
  const [step, setStep] = useState(1); // Empezamos en el paso 1

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Barra de Progreso Simple */}
      <div className="max-w-md mx-auto mb-8 flex justify-between text-xs font-bold text-slate-400">
        <span className={step >= 1 ? "text-indigo-600" : ""}>1. SERVICIO</span>
        <span className={step >= 2 ? "text-indigo-600" : ""}>2. FECHA</span>
        <span className={step >= 3 ? "text-indigo-600" : ""}>
          3. CONFIRMACIÓN
        </span>
      </div>

      <div className="max-w-md mx-auto">
        {/* PASO 1: SELECCIÓN DE SERVICIO */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">
              ¿Qué servicio buscás hoy?
            </h1>
            {SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => updateAppointment({ service })}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  appointment.service?.id === service.id
                    ? "border-indigo-600 bg-indigo-50 shadow-md"
                    : "border-white bg-white hover:border-indigo-300"
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
                <p className="text-sm text-slate-500">{service.duration} min</p>
              </button>
            ))}

            <button
              disabled={!appointment.service}
              onClick={() => setStep(2)}
              className={`w-full mt-6 p-4 rounded-xl font-bold text-white transition-all ${
                appointment.service
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-slate-300"
              }`}
            >
              Continuar a Fecha
            </button>
          </div>
        )}

        {/* PASO 2: FECHA Y HORA (Vista previa) */}
        {step === 2 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setStep(1)}
              className="text-indigo-600 text-sm font-bold mb-4 inline-block hover:underline"
            >
              ← Volver a servicios
            </button>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Elegí el día y hora
            </h2>
            <p className="text-slate-500 mb-6 italic border-l-4 border-indigo-500 pl-3">
              Reservando:{" "}
              <span className="font-bold text-slate-700">
                {appointment.service.name}
              </span>
            </p>

            <div className="space-y-6">
              {/* Selector de Fecha */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]} // No permite fechas pasadas
                  onChange={(e) => updateAppointment({ date: e.target.value })}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Selector de Hora (Hardcodeado por ahora para probar) */}
              <div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Horarios disponibles{" "}
                    {!appointment.date && "(Seleccioná una fecha primero)"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"].map(
                      (hora) => (
                        <button
                          key={hora}
                          // VALIDACIÓN: Si no hay fecha, disabled es true
                          disabled={!appointment.date}
                          onClick={() => updateAppointment({ time: hora })}
                          className={`p-2 rounded-lg border-2 font-semibold transition-all ${
                            !appointment.date
                              ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-100" // Estilo deshabilitado
                              : appointment.time === hora
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-300"
                          }`}
                        >
                          {hora}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Botón para avanzar al último paso */}
              <button
                disabled={!appointment.date || !appointment.time}
                onClick={() => setStep(3)}
                className={`w-full mt-4 p-4 rounded-xl font-bold text-white transition-all ${
                  appointment.date && appointment.time
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Confirmar Turno
              </button>
            </div>
          </div>
        )}
      </div>
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm animate-in zoom-in duration-300">
          <button
            onClick={() => setStep(2)}
            className="text-indigo-600 text-sm font-bold mb-4 inline-block"
          >
            ← Volver a fecha
          </button>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Confirmar tu turno
          </h2>

          <div className="bg-indigo-50 p-4 rounded-xl mb-6 space-y-2">
            <p className="text-slate-600">
              Servicio:{" "}
              <span className="font-bold text-slate-900">
                {appointment.service.name}
              </span>
            </p>
            <p className="text-slate-600">
              Fecha:{" "}
              <span className="font-bold text-slate-900">
                {appointment.date}
              </span>
            </p>
            <p className="text-slate-600">
              Hora:{" "}
              <span className="font-bold text-slate-900">
                {appointment.time} hs
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Tu nombre completo"
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
              onChange={(e) =>
                updateAppointment({
                  client: { ...appointment.client, phone: e.target.value },
                })
              }
              className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500"
            />

            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold p-4 rounded-xl shadow-lg transition-all mt-4"
              onClick={() =>
                alert(
                  "¡Turno reservado con éxito! (Esto se guardará en la base de datos pronto)",
                )
              }
            >
              Finalizar Reserva
            </button>
          </div>
        </div>
      )}

      {/* Debug: Lo dejamos abajo de todo para chequear el Context */}
      <div className="max-w-md mx-auto mt-10 p-4 bg-slate-800 text-white rounded-lg text-xs font-mono">
        <p>Debug - Paso Actual: {step}</p>
        <pre>{JSON.stringify(appointment, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;
