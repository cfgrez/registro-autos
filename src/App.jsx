import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "registro_vehiculos_chile_netlify_v1";

const categoriasGasto = [
  "Bencina",
  "Electricidad",
  "TAG",
  "Mantención",
  "Repuestos",
  "Seguro",
  "Permiso de circulación",
  "Revisión técnica",
  "Lavado",
  "Estacionamiento",
  "Otros",
];

const tiposDocumento = [
  "Póliza de seguro",
  "SOAP",
  "Revisión técnica",
  "Permiso de circulación",
  "Factura mantención",
  "Contrato",
  "Otro",
];

const vehiculoVacio = {
  id: "",
  patente: "",
  marca: "",
  modelo: "",
  anio: "",
  kilometraje: "",
  tipo: "Gasolina",
  proximaMantencionKm: "",
  proximaMantencionFecha: "",
  revisionTecnica: "",
  permisoCirculacion: "",
  soap: "",
  seguro: "",
  notas: "",
};

const gastoVacio = {
  id: "",
  vehiculoId: "",
  fecha: new Date().toISOString().slice(0, 10),
  categoria: "Bencina",
  monto: "",
  kilometraje: "",
  proveedor: "",
  notas: "",
};

const documentoVacio = {
  id: "",
  vehiculoId: "",
  tipo: "Póliza de seguro",
  nombre: "",
  vencimiento: "",
  fileName: "",
  fileData: "",
  notas: "",
};

function crearId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dinero(valor) {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(numero);
}

function fechaCL(fecha) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return `${d}-${m}-${y}`;
}

function diasHasta(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(`${fecha}T00:00:00`);
  return Math.ceil((objetivo - hoy) / 86400000);
}

function estadoFecha(fecha) {
  const dias = diasHasta(fecha);
  if (dias === null) return { texto: "Sin fecha", tipo: "neutro" };
  if (dias < 0) return { texto: `Vencido hace ${Math.abs(dias)} días`, tipo: "peligro" };
  if (dias <= 30) return { texto: `Vence en ${dias} días`, tipo: "alerta" };
  return { texto: `OK · ${dias} días`, tipo: "ok" };
}

function Badge({ children, tipo = "neutro" }) {
  return <span className={`badge badge-${tipo}`}>{children}</span>;
}

function Campo({ label, children }) {
  return (
    <label className="campo">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Stat({ titulo, valor, subtitulo }) {
  return (
    <Card className="stat">
      <p>{titulo}</p>
      <strong>{valor}</strong>
      {subtitulo && <small>{subtitulo}</small>}
    </Card>
  );
}

export default function App() {
  const [vehiculos, setVehiculos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [tab, setTab] = useState("resumen");
  const [vehiculoFiltro, setVehiculoFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [vehiculoForm, setVehiculoForm] = useState(vehiculoVacio);
  const [gastoForm, setGastoForm] = useState(gastoVacio);
  const [documentoForm, setDocumentoForm] = useState(documentoVacio);
  const [editandoVehiculoId, setEditandoVehiculoId] = useState(null);

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return;
    try {
      const data = JSON.parse(guardado);
      setVehiculos(data.vehiculos || []);
      setGastos(data.gastos || []);
      setDocumentos(data.documentos || []);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ vehiculos, gastos, documentos })
    );
  }, [vehiculos, gastos, documentos]);

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === vehiculoFiltro);

  const vehiculosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return vehiculos;
    return vehiculos.filter((v) =>
      `${v.patente} ${v.marca} ${v.modelo} ${v.anio}`.toLowerCase().includes(q)
    );
  }, [vehiculos, busqueda]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter(
      (g) => vehiculoFiltro === "todos" || g.vehiculoId === vehiculoFiltro
    );
  }, [gastos, vehiculoFiltro]);

  const documentosFiltrados = useMemo(() => {
    return documentos.filter(
      (d) => vehiculoFiltro === "todos" || d.vehiculoId === vehiculoFiltro
    );
  }, [documentos, vehiculoFiltro]);

  const gastosMes = useMemo(() => {
    const mesActual = new Date().toISOString().slice(0, 7);
    return gastosFiltrados.filter((g) => g.fecha?.startsWith(mesActual));
  }, [gastosFiltrados]);

  const totalMes = gastosMes.reduce((s, g) => s + Number(g.monto || 0), 0);
  const totalTag = gastosMes
    .filter((g) => g.categoria === "TAG")
    .reduce((s, g) => s + Number(g.monto || 0), 0);
  const totalBencina = gastosMes
    .filter((g) => g.categoria === "Bencina")
    .reduce((s, g) => s + Number(g.monto || 0), 0);
  const totalElectricidad = gastosMes
    .filter((g) => g.categoria === "Electricidad")
    .reduce((s, g) => s + Number(g.monto || 0), 0);

  const gastosPorCategoria = useMemo(() => {
    return categoriasGasto
      .map((categoria) => ({
        categoria,
        total: gastosMes
          .filter((g) => g.categoria === categoria)
          .reduce((s, g) => s + Number(g.monto || 0), 0),
      }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [gastosMes]);

  const alertas = useMemo(() => {
    const resultado = [];

    vehiculos.forEach((v) => {
      const fechas = [
        ["Mantención por fecha", v.proximaMantencionFecha],
        ["Revisión técnica", v.revisionTecnica],
        ["Permiso de circulación", v.permisoCirculacion],
        ["SOAP", v.soap],
        ["Seguro", v.seguro],
      ];

      fechas.forEach(([titulo, fecha]) => {
        const estado = estadoFecha(fecha);
        if (estado.tipo === "peligro" || estado.tipo === "alerta") {
          resultado.push({
            id: `${v.id}-${titulo}`,
            vehiculo: v,
            titulo,
            fecha,
            estado,
          });
        }
      });

      const kmActual = Number(v.kilometraje || 0);
      const kmProxima = Number(v.proximaMantencionKm || 0);
      if (kmActual && kmProxima && kmProxima - kmActual <= 1000) {
        const diferencia = kmProxima - kmActual;
        resultado.push({
          id: `${v.id}-mantencion-km`,
          vehiculo: v,
          titulo: "Mantención por kilometraje",
          fecha: "",
          estado:
            diferencia < 0
              ? {
                  texto: `Pasada por ${Math.abs(diferencia).toLocaleString("es-CL")} km`,
                  tipo: "peligro",
                }
              : {
                  texto: `Faltan ${diferencia.toLocaleString("es-CL")} km`,
                  tipo: "alerta",
                },
        });
      }
    });

    documentos.forEach((d) => {
      const v = vehiculos.find((x) => x.id === d.vehiculoId);
      if (!v) return;
      const estado = estadoFecha(d.vencimiento);
      if (estado.tipo === "peligro" || estado.tipo === "alerta") {
        resultado.push({
          id: d.id,
          vehiculo: v,
          titulo: d.tipo,
          fecha: d.vencimiento,
          estado,
        });
      }
    });

    return resultado.sort((a, b) => (diasHasta(a.fecha) ?? 9999) - (diasHasta(b.fecha) ?? 9999));
  }, [vehiculos, documentos]);

  function limpiarFormularios() {
    setVehiculoForm(vehiculoVacio);
    setGastoForm({
      ...gastoVacio,
      vehiculoId: vehiculoFiltro === "todos" ? "" : vehiculoFiltro,
      fecha: new Date().toISOString().slice(0, 10),
    });
    setDocumentoForm({
      ...documentoVacio,
      vehiculoId: vehiculoFiltro === "todos" ? "" : vehiculoFiltro,
    });
    setEditandoVehiculoId(null);
  }

  function guardarVehiculo(e) {
    e.preventDefault();
    if (!vehiculoForm.patente.trim()) return;

    const data = {
      ...vehiculoForm,
      patente: vehiculoForm.patente.trim().toUpperCase(),
    };

    if (editandoVehiculoId) {
      setVehiculos((prev) =>
        prev.map((v) => (v.id === editandoVehiculoId ? { ...data, id: editandoVehiculoId } : v))
      );
    } else {
      const nuevo = { ...data, id: crearId() };
      setVehiculos((prev) => [...prev, nuevo]);
      setVehiculoFiltro(nuevo.id);
    }

    limpiarFormularios();
  }

  function editarVehiculo(v) {
    setVehiculoForm(v);
    setEditandoVehiculoId(v.id);
    setTab("vehiculos");
  }

  function eliminarVehiculo(id) {
    const ok = confirm("¿Eliminar este vehículo y todos sus gastos/documentos asociados?");
    if (!ok) return;
    setVehiculos((prev) => prev.filter((v) => v.id !== id));
    setGastos((prev) => prev.filter((g) => g.vehiculoId !== id));
    setDocumentos((prev) => prev.filter((d) => d.vehiculoId !== id));
    if (vehiculoFiltro === id) setVehiculoFiltro("todos");
  }

  function guardarGasto(e) {
    e.preventDefault();
    if (!gastoForm.vehiculoId || !gastoForm.monto) return;
    setGastos((prev) => [{ ...gastoForm, id: crearId() }, ...prev]);
    setGastoForm({
      ...gastoVacio,
      vehiculoId: gastoForm.vehiculoId,
      fecha: new Date().toISOString().slice(0, 10),
    });
  }

  function eliminarGasto(id) {
    setGastos((prev) => prev.filter((g) => g.id !== id));
  }

  function archivoADataUrl(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentoForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileData: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  }

  function guardarDocumento(e) {
    e.preventDefault();
    if (!documentoForm.vehiculoId || !documentoForm.tipo) return;
    setDocumentos((prev) => [
      {
        ...documentoForm,
        id: crearId(),
        nombre: documentoForm.nombre || documentoForm.fileName || documentoForm.tipo,
      },
      ...prev,
    ]);
    setDocumentoForm({ ...documentoVacio, vehiculoId: documentoForm.vehiculoId });
  }

  function eliminarDocumento(id) {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
  }

  function exportarDatos() {
    const blob = new Blob([JSON.stringify({ vehiculos, gastos, documentos }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registro-vehiculos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importarDatos(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        setVehiculos(data.vehiculos || []);
        setGastos(data.gastos || []);
        setDocumentos(data.documentos || []);
        setVehiculoFiltro("todos");
      } catch {
        alert("No se pudo importar el archivo. Debe ser un JSON exportado desde esta aplicación.");
      }
    };
    reader.readAsText(file);
  }

  function descargarCSV() {
    const filas = [
      ["fecha", "patente", "marca", "modelo", "categoria", "monto", "kilometraje", "proveedor", "notas"],
      ...gastosFiltrados.map((g) => {
        const v = vehiculos.find((x) => x.id === g.vehiculoId) || {};
        return [
          g.fecha,
          v.patente || "",
          v.marca || "",
          v.modelo || "",
          g.categoria,
          g.monto,
          g.kilometraje,
          g.proveedor,
          g.notas,
        ];
      }),
    ];

    const csv = filas
      .map((fila) =>
        fila.map((celda) => `"${String(celda ?? "").replaceAll('"', '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gastos-vehiculos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs = [
    ["resumen", "Resumen"],
    ["vehiculos", "Vehículos"],
    ["gastos", "Gastos"],
    ["documentos", "Documentos"],
    ["alertas", "Alertas"],
  ];

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Registro familiar de vehículos</p>
          <h1>Control de autos, gastos y vencimientos</h1>
          <p className="hero-text">
            Patentes, kilometrajes, mantenciones, pólizas, revisión técnica, seguros, TAG,
            bencina y electricidad en un solo lugar.
          </p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-light" onClick={exportarDatos}>Exportar respaldo</button>
          <label className="btn btn-light file-label">
            Importar respaldo
            <input type="file" accept="application/json" onChange={(e) => importarDatos(e.target.files?.[0])} />
          </label>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <Card>
            <Campo label="Buscar">
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Patente, marca o modelo" />
            </Campo>

            <Campo label="Vehículo">
              <select value={vehiculoFiltro} onChange={(e) => setVehiculoFiltro(e.target.value)}>
                <option value="todos">Todos los vehículos</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>{v.patente} · {v.marca} {v.modelo}</option>
                ))}
              </select>
            </Campo>

            <nav className="tabs">
              {tabs.map(([id, label]) => (
                <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
                  {label}
                  {id === "alertas" && alertas.length > 0 && <span>{alertas.length}</span>}
                </button>
              ))}
            </nav>
          </Card>

          <Card className="mini-alert">
            <p>Alertas críticas</p>
            <strong>{alertas.length}</strong>
            <small>Vencimientos próximos, vencidos o mantenciones cercanas.</small>
          </Card>
        </aside>

        <main>
          {tab === "resumen" && (
            <div className="page">
              <div className="page-title">
                <h2>Resumen mensual</h2>
                <p>{vehiculoSeleccionado ? `${vehiculoSeleccionado.patente} · ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}` : "Todos los vehículos"}</p>
              </div>

              <div className="stats-grid">
                <Stat titulo="Gasto del mes" valor={dinero(totalMes)} subtitulo="Mes calendario actual" />
                <Stat titulo="Bencina" valor={dinero(totalBencina)} />
                <Stat titulo="Electricidad" valor={dinero(totalElectricidad)} />
                <Stat titulo="TAG" valor={dinero(totalTag)} />
              </div>

              <div className="two-col">
                <Card>
                  <div className="card-head">
                    <h3>Gastos por categoría</h3>
                    <button className="btn btn-small" onClick={descargarCSV}>Descargar CSV</button>
                  </div>
                  {gastosPorCategoria.length === 0 ? (
                    <p className="empty">Todavía no hay gastos registrados este mes.</p>
                  ) : (
                    <div className="bars">
                      {gastosPorCategoria.map((item) => {
                        const porcentaje = totalMes ? Math.round((item.total / totalMes) * 100) : 0;
                        return (
                          <div key={item.categoria} className="bar-item">
                            <div className="bar-info">
                              <span>{item.categoria}</span>
                              <strong>{dinero(item.total)} · {porcentaje}%</strong>
                            </div>
                            <div className="bar-track"><div className="bar-fill" style={{ width: `${porcentaje}%` }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card>
                  <h3>Próximos vencimientos</h3>
                  {alertas.slice(0, 6).length === 0 ? (
                    <p className="empty">No hay alertas por ahora.</p>
                  ) : (
                    <div className="list">
                      {alertas.slice(0, 6).map((a) => (
                        <div className="list-row" key={a.id}>
                          <div>
                            <strong>{a.titulo}</strong>
                            <p>{a.vehiculo.patente} · {a.vehiculo.marca} {a.vehiculo.modelo} {a.fecha && `· ${fechaCL(a.fecha)}`}</p>
                          </div>
                          <Badge tipo={a.estado.tipo}>{a.estado.texto}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {tab === "vehiculos" && (
            <div className="page">
              <div className="page-title">
                <h2>Vehículos</h2>
                <p>Registra patentes, kilometraje y fechas clave.</p>
              </div>

              <Card>
                <form className="form-grid" onSubmit={guardarVehiculo}>
                  <Campo label="Patente"><input required value={vehiculoForm.patente} onChange={(e) => setVehiculoForm({ ...vehiculoForm, patente: e.target.value })} placeholder="Ej: ABCD12" /></Campo>
                  <Campo label="Marca"><input value={vehiculoForm.marca} onChange={(e) => setVehiculoForm({ ...vehiculoForm, marca: e.target.value })} placeholder="BYD" /></Campo>
                  <Campo label="Modelo"><input value={vehiculoForm.modelo} onChange={(e) => setVehiculoForm({ ...vehiculoForm, modelo: e.target.value })} placeholder="Song Pro" /></Campo>
                  <Campo label="Año"><input type="number" value={vehiculoForm.anio} onChange={(e) => setVehiculoForm({ ...vehiculoForm, anio: e.target.value })} placeholder="2026" /></Campo>
                  <Campo label="Kilometraje actual"><input type="number" value={vehiculoForm.kilometraje} onChange={(e) => setVehiculoForm({ ...vehiculoForm, kilometraje: e.target.value })} /></Campo>
                  <Campo label="Tipo"><select value={vehiculoForm.tipo} onChange={(e) => setVehiculoForm({ ...vehiculoForm, tipo: e.target.value })}><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option><option>Híbrido enchufable</option></select></Campo>
                  <Campo label="Próxima mantención km"><input type="number" value={vehiculoForm.proximaMantencionKm} onChange={(e) => setVehiculoForm({ ...vehiculoForm, proximaMantencionKm: e.target.value })} /></Campo>
                  <Campo label="Próxima mantención fecha"><input type="date" value={vehiculoForm.proximaMantencionFecha} onChange={(e) => setVehiculoForm({ ...vehiculoForm, proximaMantencionFecha: e.target.value })} /></Campo>
                  <Campo label="Revisión técnica"><input type="date" value={vehiculoForm.revisionTecnica} onChange={(e) => setVehiculoForm({ ...vehiculoForm, revisionTecnica: e.target.value })} /></Campo>
                  <Campo label="Permiso circulación"><input type="date" value={vehiculoForm.permisoCirculacion} onChange={(e) => setVehiculoForm({ ...vehiculoForm, permisoCirculacion: e.target.value })} /></Campo>
                  <Campo label="SOAP"><input type="date" value={vehiculoForm.soap} onChange={(e) => setVehiculoForm({ ...vehiculoForm, soap: e.target.value })} /></Campo>
                  <Campo label="Seguro"><input type="date" value={vehiculoForm.seguro} onChange={(e) => setVehiculoForm({ ...vehiculoForm, seguro: e.target.value })} /></Campo>
                  <Campo label="Notas"><textarea value={vehiculoForm.notas} onChange={(e) => setVehiculoForm({ ...vehiculoForm, notas: e.target.value })} placeholder="Concesionario, garantía, datos del seguro, etc." /></Campo>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">{editandoVehiculoId ? "Guardar cambios" : "Agregar vehículo"}</button>
                    {editandoVehiculoId && <button type="button" className="btn" onClick={limpiarFormularios}>Cancelar</button>}
                  </div>
                </form>
              </Card>

              <div className="cards-grid">
                {vehiculosFiltrados.map((v) => {
                  const revision = estadoFecha(v.revisionTecnica);
                  const seguro = estadoFecha(v.seguro);
                  const mantencionKm = Number(v.proximaMantencionKm || 0) - Number(v.kilometraje || 0);
                  return (
                    <Card key={v.id}>
                      <div className="vehicle-head">
                        <div>
                          <h3>{v.patente}</h3>
                          <p>{v.marca} {v.modelo} {v.anio}</p>
                        </div>
                        <div className="row-actions">
                          <button className="btn btn-small" onClick={() => editarVehiculo(v)}>Editar</button>
                          <button className="btn btn-danger btn-small" onClick={() => eliminarVehiculo(v.id)}>Eliminar</button>
                        </div>
                      </div>
                      <div className="detail-grid">
                        <div><span>Kilometraje</span><strong>{Number(v.kilometraje || 0).toLocaleString("es-CL")} km</strong></div>
                        <div><span>Tipo</span><strong>{v.tipo}</strong></div>
                        <div><span>Próxima mantención</span><strong>{v.proximaMantencionKm ? `${Number(v.proximaMantencionKm).toLocaleString("es-CL")} km` : "—"}</strong></div>
                        <div><span>Faltan</span><strong>{v.proximaMantencionKm && v.kilometraje ? `${mantencionKm.toLocaleString("es-CL")} km` : "—"}</strong></div>
                        <div><span>Revisión técnica</span><Badge tipo={revision.tipo}>{revision.texto}</Badge></div>
                        <div><span>Seguro</span><Badge tipo={seguro.tipo}>{seguro.texto}</Badge></div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "gastos" && (
            <div className="page">
              <div className="page-title">
                <h2>Gastos</h2>
                <p>Registra TAG, bencina, electricidad, mantenciones y otros costos.</p>
              </div>

              <Card>
                <form className="form-grid" onSubmit={guardarGasto}>
                  <Campo label="Vehículo"><select required value={gastoForm.vehiculoId} onChange={(e) => setGastoForm({ ...gastoForm, vehiculoId: e.target.value })}><option value="">Seleccionar</option>{vehiculos.map((v) => <option key={v.id} value={v.id}>{v.patente} · {v.marca} {v.modelo}</option>)}</select></Campo>
                  <Campo label="Fecha"><input type="date" value={gastoForm.fecha} onChange={(e) => setGastoForm({ ...gastoForm, fecha: e.target.value })} /></Campo>
                  <Campo label="Categoría"><select value={gastoForm.categoria} onChange={(e) => setGastoForm({ ...gastoForm, categoria: e.target.value })}>{categoriasGasto.map((c) => <option key={c}>{c}</option>)}</select></Campo>
                  <Campo label="Monto CLP"><input required type="number" value={gastoForm.monto} onChange={(e) => setGastoForm({ ...gastoForm, monto: e.target.value })} placeholder="45000" /></Campo>
                  <Campo label="Kilometraje"><input type="number" value={gastoForm.kilometraje} onChange={(e) => setGastoForm({ ...gastoForm, kilometraje: e.target.value })} /></Campo>
                  <Campo label="Proveedor"><input value={gastoForm.proveedor} onChange={(e) => setGastoForm({ ...gastoForm, proveedor: e.target.value })} placeholder="Copec, Enel X, autopista..." /></Campo>
                  <Campo label="Notas"><input value={gastoForm.notas} onChange={(e) => setGastoForm({ ...gastoForm, notas: e.target.value })} /></Campo>
                  <div className="form-actions"><button className="btn btn-primary" type="submit">Agregar gasto</button></div>
                </form>
              </Card>

              <Card>
                <div className="card-head">
                  <h3>Historial de gastos</h3>
                  <button className="btn btn-small" onClick={descargarCSV}>Descargar CSV</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Fecha</th><th>Vehículo</th><th>Categoría</th><th>Monto</th><th>Km</th><th>Proveedor</th><th>Notas</th><th></th></tr>
                    </thead>
                    <tbody>
                      {gastosFiltrados.map((g) => {
                        const v = vehiculos.find((x) => x.id === g.vehiculoId);
                        return (
                          <tr key={g.id}>
                            <td>{fechaCL(g.fecha)}</td>
                            <td>{v ? v.patente : "—"}</td>
                            <td><Badge>{g.categoria}</Badge></td>
                            <td><strong>{dinero(g.monto)}</strong></td>
                            <td>{g.kilometraje ? `${Number(g.kilometraje).toLocaleString("es-CL")} km` : "—"}</td>
                            <td>{g.proveedor || "—"}</td>
                            <td>{g.notas || "—"}</td>
                            <td><button className="btn btn-small btn-danger" onClick={() => eliminarGasto(g.id)}>Eliminar</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {tab === "documentos" && (
            <div className="page">
              <div className="page-title">
                <h2>Documentos</h2>
                <p>Sube pólizas, SOAP, revisión técnica, permisos y facturas.</p>
              </div>

              <Card>
                <form className="form-grid" onSubmit={guardarDocumento}>
                  <Campo label="Vehículo"><select required value={documentoForm.vehiculoId} onChange={(e) => setDocumentoForm({ ...documentoForm, vehiculoId: e.target.value })}><option value="">Seleccionar</option>{vehiculos.map((v) => <option key={v.id} value={v.id}>{v.patente} · {v.marca} {v.modelo}</option>)}</select></Campo>
                  <Campo label="Tipo"><select value={documentoForm.tipo} onChange={(e) => setDocumentoForm({ ...documentoForm, tipo: e.target.value })}>{tiposDocumento.map((t) => <option key={t}>{t}</option>)}</select></Campo>
                  <Campo label="Nombre"><input value={documentoForm.nombre} onChange={(e) => setDocumentoForm({ ...documentoForm, nombre: e.target.value })} placeholder="Seguro Consorcio 2026" /></Campo>
                  <Campo label="Vencimiento"><input type="date" value={documentoForm.vencimiento} onChange={(e) => setDocumentoForm({ ...documentoForm, vencimiento: e.target.value })} /></Campo>
                  <Campo label="Archivo"><input type="file" accept="application/pdf,image/*" onChange={(e) => archivoADataUrl(e.target.files?.[0])} />{documentoForm.fileName && <small>Archivo: {documentoForm.fileName}</small>}</Campo>
                  <Campo label="Notas"><input value={documentoForm.notas} onChange={(e) => setDocumentoForm({ ...documentoForm, notas: e.target.value })} /></Campo>
                  <div className="form-actions"><button className="btn btn-primary" type="submit">Agregar documento</button></div>
                </form>
              </Card>

              <div className="cards-grid">
                {documentosFiltrados.map((d) => {
                  const v = vehiculos.find((x) => x.id === d.vehiculoId);
                  const estado = estadoFecha(d.vencimiento);
                  return (
                    <Card key={d.id}>
                      <div className="vehicle-head">
                        <div>
                          <Badge>{d.tipo}</Badge>
                          <h3>{d.nombre || d.fileName || d.tipo}</h3>
                          <p>{v ? `${v.patente} · ${v.marca} ${v.modelo}` : "Sin vehículo"}</p>
                        </div>
                        <button className="btn btn-danger btn-small" onClick={() => eliminarDocumento(d.id)}>Eliminar</button>
                      </div>
                      <div className="doc-meta">
                        <Badge tipo={estado.tipo}>{estado.texto}</Badge>
                        <span>Vence: {fechaCL(d.vencimiento)}</span>
                      </div>
                      {d.fileData && <a className="btn btn-primary" href={d.fileData} download={d.fileName || d.nombre}>Descargar archivo</a>}
                      {d.notas && <p className="notes">{d.notas}</p>}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "alertas" && (
            <div className="page">
              <div className="page-title">
                <h2>Alertas</h2>
                <p>Vencimientos y mantenciones próximas.</p>
              </div>

              <Card>
                {alertas.length === 0 ? (
                  <p className="empty">No tienes alertas críticas. Completa las fechas para activar recordatorios.</p>
                ) : (
                  <div className="list">
                    {alertas.map((a) => (
                      <div className="list-row" key={a.id}>
                        <div>
                          <strong>{a.titulo}</strong>
                          <p>{a.vehiculo.patente} · {a.vehiculo.marca} {a.vehiculo.modelo} {a.fecha && `· ${fechaCL(a.fecha)}`}</p>
                        </div>
                        <Badge tipo={a.estado.tipo}>{a.estado.texto}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>

      <footer>
        <p>
          Datos guardados localmente en este navegador. Para uso multiusuario, respaldo automático,
          login y documentos en la nube, conviene agregar Supabase, Firebase o una base de datos propia.
        </p>
      </footer>
    </div>
  );
}
