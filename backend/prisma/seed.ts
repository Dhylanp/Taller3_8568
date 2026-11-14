import { PrismaClient, Rol } from '@prisma/client';
import rooms from './data/rooms.json';
import usuarios from './data/usuarios.json';

const prisma = new PrismaClient();

// Equipamiento común por palabra clave en la descripción
const EQUIPOS = ['Proyector', 'Aire acondicionado', 'PCs', 'Pizarra', 'Micrófono', 'Audio'];

async function main() {
  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { correo: u.correo },
      update: {},
      create: {
        nombre: u.nombre,
        correo: u.correo,
        claveHash: u.claveHash,
        rol: u.correo === 'dhylan@unab.cl' ? Rol.ADMIN : Rol.ESTUDIANTE,
      },
    });
  }

  const equipos: Record<string, number> = {};
  for (const nombre of EQUIPOS) {
    const e = await prisma.equipamiento.upsert({ where: { nombre }, update: {}, create: { nombre } });
    equipos[nombre] = e.id;
  }

  for (const r of rooms) {
    const edificio = await prisma.edificio.upsert({
      where: { nombre: r.edificio },
      update: {},
      create: { nombre: r.edificio },
    });
    const espacio = await prisma.espacio.upsert({
      where: { edificioId_nombre: { edificioId: edificio.id, nombre: r.nombre } },
      update: {},
      create: {
        nombre: r.nombre,
        tipo: r.tipo,
        piso: r.piso,
        capacidad: r.capacidad,
        descripcion: r.descripcion,
        edificioId: edificio.id,
      },
    });
    const d = (r.descripcion ?? '').toLowerCase();
    const match: [string, string][] = [
      ['proyector', 'Proyector'], ['aire', 'Aire acondicionado'], ['pcs', 'PCs'],
      ['pizarra', 'Pizarra'], ['micrófono', 'Micrófono'], ['audio', 'Audio'],
    ];
    for (const [kw, nombre] of match) {
      if (d.includes(kw)) {
        await prisma.espacioEquipamiento.upsert({
          where: { espacioId_equipamientoId: { espacioId: espacio.id, equipamientoId: equipos[nombre] } },
          update: {},
          create: { espacioId: espacio.id, equipamientoId: equipos[nombre] },
        });
      }
    }
  }
  console.log('Seed OK');
}

main().finally(() => prisma.$disconnect());
