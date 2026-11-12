export class Transaccion {
  static transacciones = Transaccion.cargarDelLocalStorage();

  constructor(tipo, descripcion, monto, categoria, fecha = null, id = null) {
    this.id = id ? id : Date.now().toString();
    this.tipo = tipo;
    this.descripcion = descripcion;
    this.monto = parseFloat(monto);
    this.categoria = categoria;
    // Si no se asigna fecha, toma por defecto la fecha actual en formato YYYY-MM-DD
    this.fecha = fecha || new Date().toISOString().split("T")[0];
  }

  static cargarDelLocalStorage() {
    const datosGuardados = localStorage.getItem("transacciones_hackaton");
    if (!datosGuardados) return [];

    const objetosPlanos = JSON.parse(datosGuardados);
    return objetosPlanos.map(
      (obj) =>
        new Transaccion(
          obj.tipo,
          obj.descripcion,
          obj.monto,
          obj.categoria,
          obj.fecha,
          obj.id,
        ),
    );
  }

  static SincronizarLocalStorage() {
    localStorage.setItem(
      "transacciones_hackaton",
      JSON.stringify(Transaccion.transacciones),
    );
  }

  guardar() {
    Transaccion.transacciones.push(this);
    Transaccion.SincronizarLocalStorage();
  }

  static actualizar(id, nuevosDatos) {
    const index = Transaccion.transacciones.findIndex((t) => t.id === id);
    if (index !== -1) {
      Transaccion.transacciones[index].tipo = nuevosDatos.tipo;
      Transaccion.transacciones[index].descripcion = nuevosDatos.descripcion;
      Transaccion.transacciones[index].monto = parseFloat(nuevosDatos.monto);
      Transaccion.transacciones[index].categoria = nuevosDatos.categoria;
      Transaccion.transacciones[index].fecha = nuevosDatos.fecha;
      Transaccion.SincronizarLocalStorage();
    }
  }

  static eliminar(id) {
    Transaccion.transacciones = Transaccion.transacciones.filter(
      (t) => t.id !== id,
    );
    Transaccion.SincronizarLocalStorage();
  }

  static calcularBalance() {
    let totalIngresos = 0;
    let totalGastos = 0;

    Transaccion.transacciones.forEach((t) => {
      if (t.tipo === "ingreso") {
        totalIngresos += t.monto;
      } else {
        totalGastos += t.monto;
      }
    });

    return {
      totalIngresos,
      totalGastos,
      balanceNeto: totalIngresos - totalGastos,
    };
  }

  static obtenerResumenPorCategorias() {
    const resumen = {};
    Transaccion.transacciones.forEach((t) => {
      if (!resumen[t.categoria]) {
        resumen[t.categoria] = 0;
      }
      resumen[t.categoria] += t.monto;
    });
    return resumen;
  }

  // Método estático para agrupar movimientos por fecha para el gráfico de líneas
  static obtenerEvolucionTemporal() {
    if (Transaccion.transacciones.length === 0) {
      return { fechas: [], ingresos: [], gastos: [], balances: [] };
    }

    // Ordenar todas las transacciones en orden cronológico (de más antigua a más reciente)
    const ordenadas = [...Transaccion.transacciones].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha),
    );

    // Agrupar por fecha
    const porFecha = {};
    ordenadas.forEach((t) => {
      if (!porFecha[t.fecha]) {
        porFecha[t.fecha] = { ingreso: 0, gasto: 0 };
      }
      if (t.tipo === "ingreso") {
        porFecha[t.fecha].ingreso += t.monto;
      } else {
        porFecha[t.fecha].gasto += t.monto;
      }
    });

    const fechas = Object.keys(porFecha);
    const ingresos = [];
    const gastos = [];
    const balances = [];

    let balanceAcumulado = 0;

    fechas.forEach((f) => {
      const ing = porFecha[f].ingreso;
      const gas = porFecha[f].gasto;
      balanceAcumulado += ing - gas;

      ingresos.push(ing);
      gastos.push(gas);
      balances.push(balanceAcumulado);
    });

    return { fechas, ingresos, gastos, balances };
  }
}
