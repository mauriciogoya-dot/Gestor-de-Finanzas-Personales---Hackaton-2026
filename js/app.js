import { Transaccion } from "./classes/Transaccion.js";

// 1. Selección de elementos del DOM
const formTransaccion = document.getElementById("form-transaccion");
const formTitulo = document.getElementById("form-titulo");
const inputId = document.getElementById("transaccion-id");
const inputDescripcion = document.getElementById("descripcion");
const inputMonto = document.getElementById("monto");
const inputFecha = document.getElementById("fecha");
const inputTipo = document.getElementById("tipo");
const inputCategoria = document.getElementById("categoria");
const btnGuardar = document.getElementById("btn-guardar");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");

const filtroTipo = document.getElementById("filtro-tipo");
const tablaMovimientos = document.getElementById("tabla-movimientos");
const totalIngresosUI = document.getElementById("total-ingresos");
const totalGastosUI = document.getElementById("total-gastos");
const balanceNetoUI = document.getElementById("balance-neto");

// Variables globales para las instancias de los gráficos
let graficoCategoriasInstance = null;
let graficoEvolucionInstance = null;

// Fecha por defecto hoy
inputFecha.value = new Date().toISOString().split("T")[0];

// 2. Escuchar el submit del formulario
formTransaccion.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = inputId.value;
  const descripcion = inputDescripcion.value.trim();
  const monto = inputMonto.value;
  const fecha = inputFecha.value;
  const tipo = inputTipo.value;
  const categoria = inputCategoria.value;

  if (!descripcion || !monto || !tipo || !categoria || !fecha) return;

  if (id) {
    Transaccion.actualizar(id, { descripcion, monto, tipo, categoria, fecha });
    resetearFormulario();
  } else {
    const nuevaTransaccion = new Transaccion(
      tipo,
      descripcion,
      monto,
      categoria,
      fecha,
    );
    nuevaTransaccion.guardar();
    resetearFormulario();
  }

  actualizarApp();
});

filtroTipo.addEventListener("change", () => {
  renderizarTabla();
});

btnCancelarEdicion.addEventListener("click", () => {
  resetearFormulario();
});

function resetearFormulario() {
  formTransaccion.reset();
  inputId.value = "";
  inputFecha.value = new Date().toISOString().split("T")[0];
  formTitulo.textContent = "Nueva Transacción";
  btnGuardar.textContent = "Registrar Movimiento";
  btnCancelarEdicion.classList.add("hidden");
  inputDescripcion.focus();
}

// 3. Función principal para actualizar toda la interfaz
function actualizarApp() {
  renderizarTabla();
  actualizarBalances();
  renderizarGraficoCategorias();
  renderizarGraficoEvolucion();
}

// 4. Renderizar Tabla
function renderizarTabla() {
  tablaMovimientos.innerHTML = "";

  const filtro = filtroTipo.value;
  let transacciones = Transaccion.transacciones;

  if (filtro !== "todos") {
    transacciones = transacciones.filter((t) => t.tipo === filtro);
  }

  if (transacciones.length === 0) {
    tablaMovimientos.innerHTML = `
      <tr id="fila-vacia">
        <td colspan="6" class="py-8 text-center text-slate-400">No hay movimientos registrados.</td>
      </tr>
    `;
    return;
  }

  // Ordenar de más reciente a más antiguo para la tabla
  const transaccionesOrdenadas = [...transacciones].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  );

  transaccionesOrdenadas.forEach((t) => {
    const tr = document.createElement("tr");
    tr.className =
      "border-b border-slate-100 hover:bg-slate-50 transition duration-150";

    const esIngreso = t.tipo === "ingreso";
    const colorMonto = esIngreso ? "text-emerald-600" : "text-rose-600";
    const signoMonto = esIngreso ? "+" : "-";
    const badgeTipo = esIngreso
      ? '<span class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">Ingreso</span>'
      : '<span class="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 rounded-full">Gasto</span>';

    const [year, month, day] = t.fecha.split("-");
    const fechaFormateada = `${day}/${month}/${year}`;

    tr.innerHTML = `
      <td class="py-3 px-3 text-slate-600 font-mono text-xs">${fechaFormateada}</td>
      <td class="py-3 px-3 font-medium text-slate-800">${t.descripcion}</td>
      <td class="py-3 px-3 text-slate-600">${t.categoria}</td>
      <td class="py-3 px-3">${badgeTipo}</td>
      <td class="py-3 px-3 font-bold ${colorMonto}">${signoMonto}$${t.monto.toFixed(2)}</td>
      <td class="py-3 px-3 text-center">
        <div class="flex items-center justify-center gap-1">
          <button data-id="${t.id}" class="btn-editar text-slate-400 hover:text-blue-600 p-1 rounded-lg transition duration-150" title="Editar registro">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button data-id="${t.id}" class="btn-eliminar text-slate-400 hover:text-rose-600 p-1 rounded-lg transition duration-150" title="Eliminar registro">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    `;

    tablaMovimientos.appendChild(tr);
  });

  document.querySelectorAll(".btn-eliminar").forEach((boton) => {
    boton.addEventListener("click", (e) => {
      const idTransaccion = e.currentTarget.getAttribute("data-id");
      if (confirm("¿Estás seguro de que deseas eliminar este movimiento?")) {
        Transaccion.eliminar(idTransaccion);
        actualizarApp();
      }
    });
  });

  document.querySelectorAll(".btn-editar").forEach((boton) => {
    boton.addEventListener("click", (e) => {
      const idTransaccion = e.currentTarget.getAttribute("data-id");
      const transaccion = Transaccion.transacciones.find(
        (t) => t.id === idTransaccion,
      );
      if (transaccion) {
        inputId.value = transaccion.id;
        inputDescripcion.value = transaccion.descripcion;
        inputMonto.value = transaccion.monto;
        inputFecha.value = transaccion.fecha;
        inputTipo.value = transaccion.tipo;
        inputCategoria.value = transaccion.categoria;

        formTitulo.textContent = "Editar Transacción";
        btnGuardar.textContent = "Guardar Cambios";
        btnCancelarEdicion.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

// 5. Balance Global
function actualizarBalances() {
  const { totalIngresos, totalGastos, balanceNeto } =
    Transaccion.calcularBalance();

  totalIngresosUI.textContent = `$${totalIngresos.toFixed(2)}`;
  totalGastosUI.textContent = `$${totalGastos.toFixed(2)}`;
  balanceNetoUI.textContent = `$${balanceNeto.toFixed(2)}`;

  if (balanceNeto >= 0) {
    balanceNetoUI.className = "text-3xl font-bold text-blue-600 mt-2";
  } else {
    balanceNetoUI.className = "text-3xl font-bold text-rose-600 mt-2";
  }
}

// 6. Gráfico de Barras por Categoría
function renderizarGraficoCategorias() {
  const resumen = Transaccion.obtenerResumenPorCategorias();
  const etiquetas = Object.keys(resumen);
  const valores = Object.values(resumen);

  const canvasCtx = document
    .getElementById("grafico-categorias")
    .getContext("2d");

  if (graficoCategoriasInstance) {
    graficoCategoriasInstance.destroy();
  }

  if (etiquetas.length === 0) return;

  graficoCategoriasInstance = new Chart(canvasCtx, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Monto Total ($)",
          data: valores,
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(244, 63, 94, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(139, 92, 246, 0.7)",
            "rgba(100, 116, 139, 0.7)",
          ],
          borderColor: [
            "#2563eb",
            "#059669",
            "#e11d48",
            "#d97706",
            "#7c3aed",
            "#475569",
          ],
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Total: $${ctx.raw.toFixed(2)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (val) => "$" + val },
        },
      },
    },
  });
}

// 7. Gráfico de Líneas (Evolución Temporal)
function renderizarGraficoEvolucion() {
  const { fechas, ingresos, gastos, balances } =
    Transaccion.obtenerEvolucionTemporal();

  const canvasCtx = document
    .getElementById("grafico-evolucion")
    .getContext("2d");

  if (graficoEvolucionInstance) {
    graficoEvolucionInstance.destroy();
  }

  if (fechas.length === 0) return;

  // Formatear etiquetas de fechas a DD/MM
  const etiquetasFormateadas = fechas.map((f) => {
    const [, month, day] = f.split("-");
    return `${day}/${month}`;
  });

  graficoEvolucionInstance = new Chart(canvasCtx, {
    type: "line",
    data: {
      labels: etiquetasFormateadas,
      datasets: [
        {
          label: "Ingresos ($)",
          data: ingresos,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
        {
          label: "Egresos ($)",
          data: gastos,
          borderColor: "#f43f5e",
          backgroundColor: "rgba(244, 63, 94, 0.1)",
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
        {
          label: "Balance Neto Acumulado ($)",
          data: balances,
          borderColor: "#2563eb",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          borderWidth: 2.5,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: $${ctx.raw.toFixed(2)}`,
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: (val) => "$" + val },
        },
      },
    },
  });
}

// Inicializar la aplicación al cargar
actualizarApp();
