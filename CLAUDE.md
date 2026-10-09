# invitacionmx-catalogo

Catalogo interactivo de temas XV para Invitamx.

## Publicar cambios (deploy)

- Repo: `rbalta00/invitacionmx-catalogo`, rama `main`. Vercel: proyecto `invitacionmx-catalogo` -> https://invitacionmx-catalogo.vercel.app.
- **Deploy manual**: el `git push` solo actualiza GitHub; para que se vea en linea hay que correr `vercel --prod` aparte.
- Atajo: `.\deploy.ps1 "mensaje"` en la raiz del repo hace `git add` + `commit` + `push` + `vercel --prod` en un solo paso.
- Convencion con el usuario: cuando pida "guardar", "subir" o "publicar" este repo, correr el flujo completo sin preguntar el alcance (ver tambien `D:\repos-activos\SETUP.md` si existe esa carpeta).
