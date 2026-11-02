"use client";

// "Soy estudiante": el tercer camino del hub. El destino depende de la sesión:
// - estudiante: sus servicios;
// - con cuenta que puede activarse como estudiante: el alta de la carrera, sin salir;
// - sin sesión (o con una cuenta que no puede ser estudiante): crear la cuenta, con
//   el aviso de que la carrera se verifica después.

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ActivarEstudianteModal } from "@/components/ActivarEstudianteModal";
import { CLASES_TESELA, ContenidoTesela } from "./TeselaAccion";

export function TeselaEstudiante() {
  const { isAuthenticated, identidad, roles } = useAuth();
  const [activando, setActivando] = useState(false);

  const esEstudiante = !!identidad?.esEstudiante || roles.includes("Estudiante");

  if (esEstudiante) {
    return (
      <Link href="/panel/servicios" className={CLASES_TESELA}>
        <ContenidoTesela icono="cap" titulo="Soy estudiante" descripcion="Tus servicios, tu agenda y los turnos que publicás" />
      </Link>
    );
  }

  if (isAuthenticated && identidad?.puedeActivarEstudiante) {
    return (
      <>
        <button type="button" onClick={() => setActivando(true)} className={CLASES_TESELA}>
          <ContenidoTesela icono="cap" titulo="Soy estudiante" descripcion="Cargá tu carrera y publicá lo que sabés hacer" />
        </button>
        {activando && <ActivarEstudianteModal onClose={() => setActivando(false)} />}
      </>
    );
  }

  return (
    <Link href="/registro?como=estudiante" className={CLASES_TESELA}>
      <ContenidoTesela icono="cap" titulo="Soy estudiante" descripcion="Verificá tu carrera y publicá lo que sabés hacer" />
    </Link>
  );
}
