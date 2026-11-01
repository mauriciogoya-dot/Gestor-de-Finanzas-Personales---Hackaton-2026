import { Transaccion } from "./classes/Transaccion.js";

// 1. Selección de elementos del DOM
const formTransaccion = document.getElementById("form-transaccion");
const inputDescripcion = document.getElementById("descripcion");
const inputMonto = document.getElementById("monto");
const inputTipo = document.getElementById("tipo");
const inputCategoria = document.getElementById("categoria");

const tablaMovimientos = document.getElementById("tabla-movimientos");
const totalIngresosUI = document.getElementById("total-ingresos");
const totalGastosUI = document.getElementById("total-gastos");
const balanceNetoUI = document.getElementById("balance-neto");
const resumenCategoriasUI = document.getElementById("resumen-categorias");

// 2. Escuchar el evento submit del formulario
formTransaccion.addEventListener("submit", (e) => {
  e.preventDefault(); // Evita que la página se recargue

  // Obtener valores de los inputs
  const descripcion = inputDescripcion.value.trim();
  const monto = inputMonto.value;
  const tipo = inputTipo.value;
  const categoria = inputCategoria.value;

  // Validar que los campos no estén vacíos
  if (!descripcion || !monto || !tipo || !categoria) return;

  // Crear la nueva instancia de la clase Transaccion
  const nuevaTransaccion = new Transaccion(tipo, descripcion, monto, categoria);

  // Guardar en el array estático
  nuevaTransaccion.guardar();

  // Actualizar la interfaz visual
  actualizarApp();

  // Limpiar el formulario
  formTransaccion.reset();
  inputDescripcion.focus();
});

// 3. Función principal para actualizar toda la interfaz
function actualizarApp() {
  renderizarTabla();
  actualizarBalances();
  renderizarResumenCategorias();
}

// 4. Renderizar la tabla de movimientos
function renderizarTabla() {
  // Limpiar la tabla antes de volver a pintarla
  tablaMovimientos.innerHTML = "";

  const transacciones = Transaccion.transacciones;

  // Si no hay transacciones, mostrar mensaje de vacío
  if (transacciones.length === 0) {
    tablaMovimientos.innerHTML = `
            <tr id="fila-vacia">
                <td colspan="5" class="py-8 text-center text-slate-400">No hay movimientos registrados aún.</td>
            </tr>
        `;
    return;
  }

  // Recorrer el array y generar las filas dinámicamente
  transacciones.forEach((t) => {
    const tr = document.createElement("tr");
    tr.className =
      "border-b border-slate-100 hover:bg-slate-50 transition duration-150";

    // Estilo condicional para el monto y tipo (Verde para ingreso, Rojo para gasto)
    const esIngreso = t.tipo === "ingreso";
    const colorMonto = esIngreso ? "text-emerald-600" : "text-rose-600";
    const signoMonto = esIngreso ? "+" : "-";
    const badgeTipo = esIngreso
      ? '<span class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">Ingreso</span>'
      : '<span class="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 rounded-full">Gasto</span>';

    tr.innerHTML = `
            <td class="py-3 px-4 font-medium text-slate-800">${t.descripcion}</td>
            <td class="py-3 px-4 text-slate-600">${t.categoria}</td>
            <td class="py-3 px-4">${badgeTipo}</td>
            <td class="py-3 px-4 font-bold ${colorMonto}">${signoMonto}$${t.monto.toFixed(2)}</td>
            <td class="py-3 px-4 text-center">
                <button data-id="${t.id}" class="btn-eliminar text-slate-400 hover:text-rose-600 p-1 rounded-lg transition duration-150" title="Eliminar registro">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        `;

    tablaMovimientos.appendChild(tr);
  });

  // Agregar eventos a los botones de eliminar recién creados
  document.querySelectorAll(".btn-eliminar").forEach((boton) => {
    boton.addEventListener("click", (e) => {
      const idTransaccion = e.currentTarget.getAttribute("data-id");
      // Confirmar antes de eliminar
      if (confirm("¿Estás seguro de que deseas eliminar este movimiento?")) {
        Transaccion.eliminar(idTransaccion);
        actualizarApp(); // Volver a refrescar toda la pantalla
      }
    });
  });
}

// 5. Actualizar las tarjetas de balance global superior
function actualizarBalances() {
  const { totalIngresos, totalGastos, balanceNeto } =
    Transaccion.calcularBalance();

  totalIngresosUI.textContent = `$${totalIngresos.toFixed(2)}`;
  totalGastosUI.textContent = `$${totalGastos.toFixed(2)}`;
  balanceNetoUI.textContent = `$${balanceNeto.toFixed(2)}`;

  // Dar color dinámico al balance neto según si es positivo o negativo
  if (balanceNeto >= 0) {
    balanceNetoUI.className = "text-3xl font-bold text-blue-600 mt-2";
  } else {
    balanceNetoUI.className = "text-3xl font-bold text-rose-600 mt-2";
  }
}

// 6. Renderizar el resumen agrupado por categorías
function renderizarResumenCategorias() {
  resumenCategoriasUI.innerHTML = "";
  const resumen = Transaccion.obtenerResumenPorCategorias();
  const categoriasKeys = Object.keys(resumen);

  if (categoriasKeys.length === 0) {
    resumenCategoriasUI.innerHTML = `<p class="text-slate-400 text-sm col-span-full">Aún no hay datos para resumir.</p>`;
    return;
  }

  categoriasKeys.forEach((cat) => {
    const montoTotal = resumen[cat];
    const tarjetaCat = document.createElement("div");
    tarjetaCat.className =
      "bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col";
    tarjetaCat.innerHTML = `
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">${cat}</span>
            <span class="text-xl font-bold text-slate-800 mt-1">$${montoTotal.toFixed(2)}</span>
        `;
    resumenCategoriasUI.appendChild(tarjetaCat);
  });
}
// 7. LLAMADA INICIAL AL CARGAR LA PAGINA
// Esto asegura que si ya había datos guardados, la pantalla los muestre de inmediato al abrir la app.
actualizarApp();
