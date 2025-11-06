// app.js — con hora de salida editable
class Propietario {
  constructor(dni, nombre, direccion, celular) {
    this.dni = dni;
    this.nombre = nombre;
    this.direccion = direccion;
    this.celular = celular;
  }
}

class RegistroVehiculo {
  constructor(propietario, tipo, horas, horaIngreso, llegoTarde = false, horaSalida = "") {
    this.propietario = propietario;
    this.tipo = tipo;
    this.horas = horas;
    this.horaIngreso = horaIngreso;
    this.horaSalida = horaSalida;
    this.llegoTarde = llegoTarde;
    this.costoHora = this.obtenerCosto();
    this.total = this.calcularTotal();
    this.fechaRegistro = new Date().toLocaleString();
  }

  obtenerCosto() {
    switch (this.tipo) {
      case "Sedan": return 20;
      case "Pickup": return 25;
      case "SUV": return 40;
      default: return 0;
    }
  }

  calcularTotal() {
    if (this.horas < 1) throw new Error("El tiempo de alquiler no puede ser menor a 1 hora.");
    let subtotal = this.horas * this.costoHora;
    if (this.llegoTarde) subtotal *= 1.15;
    return subtotal.toFixed(2);
  }
}

class SistemaEstacionamiento {
  constructor() {
    this.registros = JSON.parse(localStorage.getItem("registros") || "[]");
  }

  agregar(registro) {
    this.registros.push(registro);
    this.guardar();
  }

  eliminar(index) {
    this.registros.splice(index, 1);
    this.guardar();
  }

  marcarTardanza(index) {
    const registro = this.registros[index];
    if (!registro.llegoTarde) {
      registro.llegoTarde = true;
      const base = new RegistroVehiculo(
        registro.propietario,
        registro.tipo,
        registro.horas,
        registro.horaIngreso,
        true,
        registro.horaSalida
      );
      registro.total = base.total;
      registro.fechaRegistro = new Date().toLocaleString() + " (actualizado por tardanza)";
      this.guardar();
      alert(`Se aplicó el 15% adicional. Nuevo total: S/.${registro.total}`);
    } else {
      alert("Este registro ya tiene el recargo del 15% aplicado.");
    }
  }

  registrarSalida(index) {
    const registro = this.registros[index];
    const horaSalida = prompt("Ingrese la hora de salida (formato HH:MM):", registro.horaSalida || "");
    if (!horaSalida) return;

    registro.horaSalida = horaSalida;

    // Calcular si se pasó del tiempo
    const [hIn, mIn] = registro.horaIngreso.split(":").map(Number);
    const [hOut, mOut] = horaSalida.split(":").map(Number);
    const tiempoReal = (hOut * 60 + mOut - (hIn * 60 + mIn)) / 60;

    if (tiempoReal > registro.horas) {
      registro.llegoTarde = true;
      const base = new RegistroVehiculo(
        registro.propietario,
        registro.tipo,
        registro.horas,
        registro.horaIngreso,
        true,
        horaSalida
      );
      registro.total = base.total;
      alert("Se detectó tardanza. Se aplicó +15% al total.");
    } else {
      registro.llegoTarde = false;
      registro.total = (registro.horas * registro.costoHora).toFixed(2);
      alert("Salida registrada correctamente. Sin recargo.");
    }

    registro.fechaRegistro = new Date().toLocaleString() + " (salida registrada)";
    this.guardar();
  }

  guardar() {
    localStorage.setItem("registros", JSON.stringify(this.registros));
  }
}

const sistema = new SistemaEstacionamiento();

const form = document.getElementById("formEstacionamiento");
const resultado = document.getElementById("resultado");
const lista = document.getElementById("lista");
const btnCalcular = document.getElementById("btnCalcular");
const btnLimpiar = document.getElementById("btnLimpiar");

function mostrarRegistros() {
  lista.innerHTML = "";
  if (sistema.registros.length === 0) {
    lista.innerHTML = "<li>No hay registros guardados.</li>";
    return;
  }

  sistema.registros.forEach((r, i) => {
    const li = document.createElement("li");
    li.classList.add("registro");

    const estado = r.llegoTarde ? "Con recargo (+15%)" : "Puntual";
    const salida = r.horaSalida || "—";
    li.innerHTML = `
      <div><strong>Propietario:</strong> ${r.propietario.nombre}</div>
      <div><strong>DNI:</strong> ${r.propietario.dni}</div>
      <div><strong>Dirección:</strong> ${r.propietario.direccion}</div>
      <div><strong>Celular:</strong> ${r.propietario.celular}</div>
      <div><strong>Vehículo:</strong> ${r.tipo}</div>
      <div><strong>Horas alquiladas:</strong> ${r.horas}</div>
      <div><strong>Hora de ingreso:</strong> ${r.horaIngreso}</div>
      <div><strong>Hora de salida:</strong> ${salida}</div>
      <div><strong>Total a pagar:</strong> S/.${r.total}</div>
      <div><strong>Estado:</strong> ${estado}</div>
      <div><strong>Última actualización:</strong> ${r.fechaRegistro}</div>
    `;

    const botones = document.createElement("div");
    botones.classList.add("acciones");

    const btnSalida = document.createElement("button");
    btnSalida.textContent = "Registrar salida";
    btnSalida.style.background = "#16a085";
    btnSalida.onclick = () => {
      sistema.registrarSalida(i);
      mostrarRegistros();
    };

    const btnDel = document.createElement("button");
    btnDel.textContent = "Eliminar";
    btnDel.classList.add("btn-eliminar");
    btnDel.onclick = () => {
      if (confirm("¿Eliminar este registro?")) {
        sistema.eliminar(i);
        mostrarRegistros();
      }
    };

    botones.appendChild(btnSalida);
    botones.appendChild(btnDel);
    li.appendChild(botones);
    lista.appendChild(li);
  });
}

btnCalcular.addEventListener("click", () => {
  const tipo = document.getElementById("tipo").value;
  const horas = Number(document.getElementById("horas").value);

  if (!tipo) return alert("Seleccione el tipo de vehículo.");
  if (horas < 1) return alert("El tiempo de alquiler no puede ser menor a 1 hora.");

  let costo = 0;
  if (tipo === "Sedan") costo = 20;
  else if (tipo === "Pickup") costo = 25;
  else if (tipo === "SUV") costo = 40;

  let total = horas * costo;
  resultado.textContent = `Pago total estimado: S/. ${total.toFixed(2)} (${tipo} - S/.${costo}/hr)`;
});

form.addEventListener("submit", e => {
  e.preventDefault();

  const dni = document.getElementById("dni").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const celular = document.getElementById("celular").value.trim();
  const tipo = document.getElementById("tipo").value;
  const horas = Number(document.getElementById("horas").value);
  const horaIngreso = document.getElementById("horaIngreso").value;

  if (!/^[0-9]{8}$/.test(dni)) return alert("El DNI debe tener 8 dígitos.");
  if (!/^[0-9]{9}$/.test(celular)) return alert("El celular debe tener 9 dígitos.");
  if (horas < 1) return alert("El tiempo de alquiler no puede ser menor a 1 hora.");
  if (!horaIngreso) return alert("Ingrese la hora de ingreso.");

  const propietario = new Propietario(dni, nombre, direccion, celular);
  const registro = new RegistroVehiculo(propietario, tipo, horas, horaIngreso);

  sistema.agregar(registro);
  resultado.textContent = `Registro guardado. Total: S/.${registro.total}`;
  mostrarRegistros();
  form.reset();
  document.getElementById("horas").value = 1;
});

btnLimpiar.addEventListener("click", () => {
  if (confirm("¿Desea limpiar el formulario?")) {
    form.reset();
    resultado.textContent = "";
  }
});

mostrarRegistros();
