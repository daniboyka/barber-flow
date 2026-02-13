function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">
          ¡Tailwind Funcionando! 🚀
        </h1>
        <p className="text-gray-600 text-lg">
          Si ves este fondo oscuro, el botón azul y esta tarjeta blanca, 
          estamos listos para el BarberFlow.
        </p>
        <button className="mt-6 px-6 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-700 transition">
          Confirmar Instalación
        </button>
      </div>
    </div>
  )
}

export default App