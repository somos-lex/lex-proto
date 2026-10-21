using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Data;

public static class DbSeeder
{
    // Roles base de LEX.
    private static readonly string[] RolesBase = { "Estudiante", "Cliente", "Agencia", "Admin" };

    // Todo el catalogo de ejemplo queda marcado como pendiente de validacion institucional.
    private const string ObservacionCatalogo =
        "Catálogo de ejemplo — pendiente de validación con facultad correspondiente.";

    // Emails de los estudiantes del seed base. Sufijo distinto de "@demo.com" a
    // proposito: DemoService borra por ese sufijo y no debe arrastrarse estos.
    private const string SeedEmailSuffix = "@seed.lex";
    private const string SeedPassword = "Seed1234";

    public static async Task SeedAsync(AppDbContext db, string adminEmail, string adminPassword)
    {
        await SeedRolesAsync(db);
        await SeedInstitucionesYCarrerasAsync(db);
        await SeedSupervisoresAsync(db);
        await SeedCatalogoServiciosAsync(db);
        await SeedMateriasAsync(db);
        await SeedEstudiantesEjemploAsync(db);
        await SeedClasesEjemploAsync(db);
        await SeedAdminAsync(db, adminEmail, adminPassword);
    }

    private static async Task SeedRolesAsync(AppDbContext db)
    {
        var existentes = await db.Roles.Select(r => r.Nombre).ToListAsync();
        foreach (var nombre in RolesBase.Except(existentes))
            db.Roles.Add(new Rol { Nombre = nombre });

        await db.SaveChangesAsync();
    }

    // Catalogo institucional del NEA. Da sustento a la validacion institucional
    // y puebla los selectores de carrera/institucion del frontend.
    private static async Task SeedInstitucionesYCarrerasAsync(AppDbContext db)
    {
        // 1) Tipos de institucion.
        var tiposBase = new[] { "Universidad", "Instituto Terciario" };
        var tiposExistentes = await db.TiposInstitucion.ToListAsync();
        foreach (var nombre in tiposBase.Where(n => tiposExistentes.All(t => t.Nombre != n)))
            db.TiposInstitucion.Add(new TipoInstitucion { Nombre = nombre });
        await db.SaveChangesAsync();

        var universidad = await db.TiposInstitucion.FirstAsync(t => t.Nombre == "Universidad");
        var terciario = await db.TiposInstitucion.FirstAsync(t => t.Nombre == "Instituto Terciario");

        // 2) Instituciones con sus carreras. area_conocimiento "Salud" habilita
        //    servicios que requieren supervision.
        var catalogo = new (string Institucion, int TipoId, string Provincia, string Ciudad,
                            (string Carrera, string? Area)[] Carreras)[]
        {
            ("Universidad Nacional del Nordeste (UNNE)", universidad.TipoInstitucionId, "Corrientes", "Corrientes", new[]
            {
                ("Medicina", (string?)"Salud"),
                ("Odontología", (string?)"Salud"),
                ("Veterinaria", (string?)"Salud"),
                ("Bioquímica", (string?)"Salud"),
                ("Enfermería", (string?)"Salud"),
                // Nombre oficial de la Facultad de Medicina (med.unne.edu.ar). Se agrega
                // para el Banco de Turnos: es carrera con practica clinica obligatoria.
                ("Licenciatura en Kinesiología y Fisiatría", (string?)"Salud"),
                ("Diseño Gráfico", (string?)"Diseño"),
                ("Licenciatura en Sistemas de Información", (string?)"Tecnología"),
                ("Abogacía", (string?)"Derecho"),
                ("Contador Público", (string?)"Economía"),
            }),
            ("Universidad Tecnológica Nacional - FRRe", universidad.TipoInstitucionId, "Chaco", "Resistencia", new[]
            {
                ("Ingeniería en Sistemas de Información", (string?)"Tecnología"),
                ("Ingeniería Electrónica", (string?)"Ingeniería"),
                ("Ingeniería Química", (string?)"Ingeniería"),
            }),
            ("Universidad de la Cuenca del Plata", universidad.TipoInstitucionId, "Corrientes", "Corrientes", new[]
            {
                ("Psicología", (string?)"Salud"),
                ("Diseño de Indumentaria", (string?)"Diseño"),
                ("Licenciatura en Marketing", (string?)"Negocios"),
            }),
            ("Instituto Superior de Formación Docente y Técnica", terciario.TipoInstitucionId, "Corrientes", "Corrientes", new[]
            {
                ("Tecnicatura en Desarrollo de Software", (string?)"Tecnología"),
                ("Profesorado de Matemática", (string?)"Educación"),
            }),
        };

        foreach (var item in catalogo)
        {
            var institucion = await db.Instituciones
                .Include(i => i.Carreras)
                .FirstOrDefaultAsync(i => i.Nombre == item.Institucion);

            if (institucion is null)
            {
                institucion = new Institucion
                {
                    Nombre = item.Institucion,
                    TipoInstitucionId = item.TipoId,
                    Provincia = item.Provincia,
                    Ciudad = item.Ciudad
                };
                db.Instituciones.Add(institucion);
            }

            foreach (var (carrera, area) in item.Carreras)
            {
                if (institucion.Carreras.All(c => c.Nombre != carrera))
                    institucion.Carreras.Add(new Carrera { Nombre = carrera, AreaConocimiento = area });
            }
        }

        await db.SaveChangesAsync();
    }

    // Materias con atencion de pacientes para el Banco de Turnos. A diferencia del catalogo
    // de servicios (marcado como "de ejemplo"), estas salen de los planes de estudio
    // oficiales vigentes a octubre de 2026, y anio_minimo es el año del plan en que se
    // cursan. El prototipo se muestra a estudiantes de estas facultades: una materia
    // inexistente o un año mal puesto cuesta credibilidad. Fuentes en README_PRACTICAS.md.
    private static async Task SeedMateriasAsync(AppDbContext db)
    {
        const string Unne = "Universidad Nacional del Nordeste (UNNE)";

        var materias = new (string Carrera, string Materia, int AnioMinimo)[]
        {
            // Odontología — FOUNNE, Plan de Estudios 134/2023.
            ("Odontología", "Práctica Clínica Preventiva", 3),
            ("Odontología", "Clínica Rehabilitadora", 4),
            ("Odontología", "Periodoncia", 4),
            ("Odontología", "Clínica Integral Adulto", 5),
            ("Odontología", "Clínica en Odontopediatría", 5),

            // Medicina Veterinaria — FCV UNNE, Plan 2008 (Res. 637/08-CS). En el seed la
            // carrera se llama "Veterinaria".
            ("Veterinaria", "Semiología", 3),
            ("Veterinaria", "Cirugía y Anestesiología", 4),
            ("Veterinaria", "Clínica de Pequeños Animales", 5),
            ("Veterinaria", "Clínica de Grandes Animales", 5),

            // Licenciatura en Kinesiología y Fisiatría — Facultad de Medicina UNNE
            // (Res. 501/03-CS y modificaciones).
            ("Licenciatura en Kinesiología y Fisiatría", "Técnicas Evaluativas Funcionales", 3),
            ("Licenciatura en Kinesiología y Fisiatría", "Kinesiterapia I", 3),
            ("Licenciatura en Kinesiología y Fisiatría", "Clínica Kinésica Médica", 4),
            ("Licenciatura en Kinesiología y Fisiatría", "Clínica Kinésica Quirúrgica", 4),
            ("Licenciatura en Kinesiología y Fisiatría", "Prácticas Profesionales Intensivas", 5),
        };

        // Las carreras se buscan dentro de UNNE: el nombre solo no es unico entre instituciones.
        var carreras = await db.Carreras
            .Where(c => c.Institucion.Nombre == Unne)
            .ToListAsync();
        int CarreraId(string nombre) => carreras.FirstOrDefault(c => c.Nombre == nombre)?.CarreraId
            ?? throw new InvalidOperationException($"Falta la carrera '{nombre}' de UNNE en el catálogo institucional.");

        var existentes = await db.Materias
            .Select(m => new { m.CarreraId, m.Nombre })
            .ToListAsync();

        foreach (var (carrera, materia, anioMinimo) in materias)
        {
            var carreraId = CarreraId(carrera);
            if (existentes.Any(e => e.CarreraId == carreraId && e.Nombre == materia))
                continue;

            db.Materias.Add(new Materia
            {
                CarreraId = carreraId,
                Nombre = materia,
                AnioMinimo = anioMinimo,
                Activa = true
            });
        }

        await db.SaveChangesAsync();
    }

    // Profesionales matriculados que respaldan los servicios de Salud.
    private static async Task SeedSupervisoresAsync(AppDbContext db)
    {
        var unne = await db.Instituciones
            .FirstOrDefaultAsync(i => i.Nombre == "Universidad Nacional del Nordeste (UNNE)");

        var supervisores = new (string Nombre, string Matricula, string Especialidad)[]
        {
            ("Dr. Juan Ramírez",   "12345", "Odontólogo"),
            ("Dra. María Gómez",   "67890", "Veterinaria"),
            ("Dr. Carlos Torres",  "54321", "Odontólogo"),
        };

        foreach (var (nombre, matricula, especialidad) in supervisores)
        {
            if (await db.ProfesionalesSupervisores.AnyAsync(p => p.Matricula == matricula))
                continue;

            db.ProfesionalesSupervisores.Add(new ProfesionalSupervisor
            {
                NombreCompleto = nombre,
                Matricula = matricula,
                Especialidad = especialidad,
                InstitucionId = unne?.InstitucionId,
                Activo = true,
                FechaAlta = DateTime.UtcNow,
                Observaciones = ObservacionCatalogo
            });
        }

        await db.SaveChangesAsync();
    }

    // Catalogo CERRADO: 10 entradas de ProyectoCerrado + 10 de Salud, cada una
    // habilitada para una o mas carreras con su año minimo.
    private static async Task SeedCatalogoServiciosAsync(AppDbContext db)
    {
        // (Nombre, Descripcion, Tipo, RequiereSupervisor, [(Carrera, AnioMinimo)])
        var catalogo = new (string Nombre, string Descripcion, TipoServicio Tipo, bool RequiereSupervisor,
                            (string Carrera, int AnioMinimo)[] Carreras)[]
        {
            // --- Proyecto Cerrado (10) ---
            ("Diseño de logotipo",
             "Diseño de un logotipo a medida, con propuestas iniciales, rondas de revisión y archivos finales.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Diseño Gráfico", 2) }),

            ("Identidad de marca completa",
             "Logotipo, paleta de colores, tipografías y manual de marca básico.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Diseño Gráfico", 3) }),

            ("Diseño editorial (folletos/revistas)",
             "Diagramación de piezas editoriales: folletos, catálogos o revistas, listas para imprenta.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Diseño Gráfico", 2) }),

            ("Ilustración digital",
             "Ilustración digital personalizada para piezas gráficas, editoriales o redes.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Diseño Gráfico", 2) }),

            ("Diseño UX/UI",
             "Diseño de interfaz y experiencia de usuario: wireframes, prototipo navegable y guía visual.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Diseño Gráfico", 2), ("Licenciatura en Sistemas de Información", 3) }),

            ("Desarrollo de sitio web informativo",
             "Sitio web informativo, responsivo, con formulario de contacto y optimización básica para buscadores.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Licenciatura en Sistemas de Información", 2) }),

            ("Desarrollo de e-commerce",
             "Tienda online con catálogo de productos, carrito y pasarela de pago integrada.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Licenciatura en Sistemas de Información", 2) }),

            ("Desarrollo de aplicación móvil básica",
             "Aplicación móvil de alcance acotado, con navegación, consumo de API y publicación asistida.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Licenciatura en Sistemas de Información", 3) }),

            ("Base de datos y modelado",
             "Modelo de datos, diagrama entidad-relación y script de creación de la base.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Licenciatura en Sistemas de Información", 2) }),

            ("Automatización con scripts",
             "Automatización de tareas repetitivas mediante scripts, con documentación de uso.",
             TipoServicio.ProyectoCerrado, false,
             new[] { ("Licenciatura en Sistemas de Información", 2) }),

            // --- Salud (10) — todas requieren supervisor matriculado ---
            ("Consulta odontológica básica",
             "Consulta y diagnóstico odontológico inicial, realizado bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Odontología", 3) }),

            ("Higiene bucal completa",
             "Limpieza y profilaxis bucal completa, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Odontología", 3) }),

            ("Obturación simple (empaste)",
             "Obturación de una pieza dental con caries simple, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Odontología", 4) }),

            ("Extracción dental simple",
             "Extracción de una pieza dental sin complicaciones, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Odontología", 4) }),

            ("Blanqueamiento dental",
             "Tratamiento de blanqueamiento dental, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Odontología", 4) }),

            ("Consulta clínica general (Veterinaria)",
             "Consulta clínica general de la mascota, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Veterinaria", 4) }),

            ("Aplicación de vacunas (Veterinaria)",
             "Aplicación del plan de vacunación de la mascota, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Veterinaria", 3) }),

            ("Higiene dental veterinaria",
             "Higiene y control dental de la mascota, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Veterinaria", 4) }),

            ("Curación de heridas menores (Veterinaria)",
             "Limpieza y curación de heridas menores de la mascota, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Veterinaria", 3) }),

            ("Control de peso y nutrición (Veterinaria)",
             "Control de peso y plan nutricional de la mascota, bajo supervisión de un profesional matriculado.",
             TipoServicio.Salud, true,
             new[] { ("Veterinaria", 3) }),
        };

        var carreras = await db.Carreras.ToListAsync();
        int CarreraId(string nombre) => carreras.FirstOrDefault(c => c.Nombre == nombre)?.CarreraId
            ?? throw new InvalidOperationException($"Falta la carrera '{nombre}' en el catálogo institucional.");

        foreach (var item in catalogo)
        {
            var entrada = await db.CatalogoServicios
                .Include(c => c.Carreras)
                .FirstOrDefaultAsync(c => c.Nombre == item.Nombre);

            if (entrada is null)
            {
                entrada = new CatalogoServicio
                {
                    Nombre = item.Nombre,
                    Descripcion = item.Descripcion,
                    TipoServicio = item.Tipo,
                    RequiereSupervisor = item.RequiereSupervisor,
                    Activo = true,
                    Observaciones = ObservacionCatalogo,
                    FechaCreacion = DateTime.UtcNow
                };
                db.CatalogoServicios.Add(entrada);
            }

            // Habilitaciones por carrera (idempotente: solo agrega las que faltan).
            foreach (var (carrera, anioMinimo) in item.Carreras)
            {
                var carreraId = CarreraId(carrera);
                if (entrada.Carreras.All(cc => cc.CarreraId != carreraId))
                {
                    entrada.Carreras.Add(new CatalogoServicioCarrera
                    {
                        CarreraId = carreraId,
                        AnioMinimo = anioMinimo
                    });
                }
            }
        }

        await db.SaveChangesAsync();
    }

    // 4 estudiantes de ejemplo del seed base, para que la plataforma no arranque
    // vacia. Son Cliente Particular + perfil de Estudiante, con la carrera ya
    // verificada (igual que el flujo real de ActivarEstudiante).
    private static readonly (string Email, string Nombre, string Carrera, int Anio, string Bio)[] EstudiantesEjemplo =
    {
        ("ana.seed@seed.lex",   "Ana Benítez",    "Profesorado de Matemática",                3, "Estudiante avanzada del profesorado. Doy apoyo escolar en matemática."),
        ("bruno.seed@seed.lex", "Bruno Ledesma",  "Licenciatura en Marketing",                3, "Bilingüe en inglés. Doy clases conversacionales para adultos."),
        ("carla.seed@seed.lex", "Carla Ojeda",    "Licenciatura en Sistemas de Información",  4, "Estudiante de sistemas. Doy apoyo en programación y estructuras de datos."),
        ("dario.seed@seed.lex", "Darío Quiroz",   "Profesorado de Matemática",                4, "Preparo finales de matemática universitaria: cálculo y álgebra."),
    };

    private static async Task SeedEstudiantesEjemploAsync(AppDbContext db)
    {
        var faltantes = new List<(string Email, string Nombre, string Carrera, int Anio, string Bio)>();
        foreach (var e in EstudiantesEjemplo)
        {
            if (!await db.Usuarios.AnyAsync(u => u.Email == e.Email))
                faltantes.Add(e);
        }
        if (faltantes.Count == 0)
            return;

        var rolCliente = await db.Roles.FirstAsync(r => r.Nombre == "Cliente");
        var rolEstudiante = await db.Roles.FirstAsync(r => r.Nombre == "Estudiante");
        var carreras = await db.Carreras.ToListAsync();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(SeedPassword);
        var ahora = DateTime.UtcNow;

        foreach (var e in faltantes)
        {
            var carreraId = carreras.FirstOrDefault(c => c.Nombre == e.Carrera)?.CarreraId
                ?? throw new InvalidOperationException($"Falta la carrera '{e.Carrera}' para el estudiante de ejemplo.");

            var usuario = new Usuario
            {
                Email = e.Email,
                PasswordHash = passwordHash,
                NombreCompleto = e.Nombre,
                FechaRegistro = ahora,
                Activo = true,
                PerfilCliente = new PerfilCliente { TipoCliente = (int)TipoCliente.Particular },
                PerfilEstudiante = new PerfilEstudiante
                {
                    Bio = e.Bio,
                    AnioCursado = e.Anio,
                    Disponible = true
                }
            };
            usuario.UsuarioRoles.Add(new UsuarioRol { Rol = rolCliente });
            usuario.UsuarioRoles.Add(new UsuarioRol { Rol = rolEstudiante });
            usuario.PerfilEstudiante.EstudianteCarreras.Add(new EstudianteCarrera
            {
                CarreraId = carreraId,
                EstadoVerificacion = EstadoVerificacion.Verificado,
                FechaVerificacion = ahora
            });

            db.Usuarios.Add(usuario);
        }

        await db.SaveChangesAsync();
    }

    // Servicios de Clase de ejemplo (vertical de catalogo LIBRE: no dependen del
    // catalogo cerrado ni de la carrera del estudiante).
    private static async Task SeedClasesEjemploAsync(AppDbContext db)
    {
        var clases = new (string Email, string Titulo, string Descripcion, string Materia, NivelClase Nivel,
                          ModalidadClase Modalidad, int Duracion, decimal Precio, bool EsPaquete, int? Sesiones)[]
        {
            ("ana.seed@seed.lex",
             "Clases de matemática secundaria",
             "Apoyo escolar en matemática para nivel secundario: álgebra, funciones y preparación de pruebas.",
             "Matemática", NivelClase.Secundario, ModalidadClase.Online, 60, 3000m, false, null),

            ("bruno.seed@seed.lex",
             "Clases de inglés conversacional",
             "Clases de inglés conversacional para adultos, adaptadas a tu nivel, con práctica oral y material.",
             "Inglés", NivelClase.Adulto, ModalidadClase.Ambas, 60, 4000m, true, 8),

            ("carla.seed@seed.lex",
             "Apoyo en programación C y Java",
             "Clases particulares de programación: estructuras, POO y resolución de trabajos prácticos.",
             "Programación", NivelClase.Universitario, ModalidadClase.Online, 90, 5000m, false, null),

            ("dario.seed@seed.lex",
             "Preparación de finales de matemática universitaria",
             "Preparación intensiva de finales: cálculo diferencial e integral, con ejercitación guiada.",
             "Cálculo I", NivelClase.Universitario, ModalidadClase.Ambas, 90, 4500m, true, 4),
        };

        var ahora = DateTime.UtcNow;

        foreach (var c in clases)
        {
            var estudianteId = await db.Usuarios
                .Where(u => u.Email == c.Email)
                .Select(u => u.UsuarioId)
                .FirstOrDefaultAsync();

            if (estudianteId == 0)
                continue; // el estudiante de ejemplo no existe: nada que sembrar.

            if (await db.ServiciosClase.AnyAsync(s => s.EstudianteId == estudianteId && s.Titulo == c.Titulo))
                continue;

            db.ServiciosClase.Add(new ServicioClase
            {
                EstudianteId = estudianteId,
                Titulo = c.Titulo,
                Descripcion = c.Descripcion,
                Precio = c.Precio,
                Activo = true,
                FechaPublicacion = ahora,
                Materia = c.Materia,
                Nivel = c.Nivel,
                Modalidad = c.Modalidad,
                DuracionMinutosSesion = c.Duracion,
                EsPaquete = c.EsPaquete,
                CantidadSesionesPaquete = c.Sesiones
            });
        }

        await db.SaveChangesAsync();
    }

    // Usuario Admin para la demo: login normal -> acceso al panel de ingresos.
    private static async Task SeedAdminAsync(AppDbContext db, string adminEmail, string adminPassword)
    {
        var email = adminEmail.Trim();
        if (await db.Usuarios.AnyAsync(u => u.Email == email))
            return;

        var rolAdmin = await db.Roles.FirstOrDefaultAsync(r => r.Nombre == "Admin")
            ?? throw new InvalidOperationException("El rol 'Admin' no fue sembrado antes del usuario admin.");

        var admin = new Usuario
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            NombreCompleto = "LEX Admin",
            FechaRegistro = DateTime.UtcNow,
            Activo = true
        };
        // Admin no tiene perfil de Estudiante/Cliente/Agencia: solo el rol.
        admin.UsuarioRoles.Add(new UsuarioRol { Rol = rolAdmin });

        db.Usuarios.Add(admin);
        await db.SaveChangesAsync();
    }
}
