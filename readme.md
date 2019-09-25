

# Simple Storage Server

Spécification d'un serveur d'hebergement de fichier par http. Permet de stocker des fichier et de les rattacher à un utilisateur. L'API mise a disposition du serveur est décrite en dessous. Deux implémentation d'éxemple sont disponible, en nodejs et en php.

## Réponse en cas d'erreur

Lors de l'utilisation de l'api si la requete est invalide le retour est de la forme suivante

```json
{
    success: false,
    code: int,
    message: "string"
}
```

Les codes d'erreurs sont les suivants :

- 01 : Requete invalide
- 02 : Authentification incorrect
- 03 : Utilisateur inconnu
- 04 : Jeton invalide
- 05 : Erreur serveur
- 06 : Fichier introuvable

## Points d'éntrées 

`GET /authentication`

Indique si le serveur necessite un mot de passe pour accèder aux fichiers

```json
// Reponse
{
    success: true,
    authentication: boolean
}
```

------

`POST /register`

Inscrit un utilisateur sur le serveur

```json
// Requete
{
    user: "string",
    password: "string"
}
// Response
{
    success: true
}
```



------

`POST /login`

Connexion de l'utilisateur et retourne un jeton de connexion. Le jeton de connexion est valide 12h00 après son émission.

```json
// Requete
{
    user: "string",
    password: "string"
}
// Reponse
{
    success: true,
    token: "string"
}
```

------

`POST /token`

Permet de tester la validitée d'un jeton émit lors de la connexion

```json
// Requete
{
    user: "string", // Username
    token: "string"
}
// Reponse
{
    success: true,
    valid: boolean
}
```



------

`POST /list`

Liste les fichiers disponible pour l'utilisateur. La valeur token n'est necessaire que si l'authentification est activée.

```json
// Requete
{
    user: "string", // Username
    token: "string"
}
// Reponse
{
    success: true,
    total: number,
    list: ["fileId1", "fileId2", ...]
}
```

------

`POST /get/{file}`

Récupère un fichier. Remplacer {file} par l'id du fichier à récupèrer. La valeur token n'est necessaire que si l'authentification est activée.

```json
// Requete
{
    user: "string", // Username
    token: "string"
}
// Reponse
{
    success: true,
    fileid: "string",
    filename: "string",
    data: "string"
}
```

------

`POST /save/{file}`

Sauvegarde un fichier. Remplacer {file} par le nom du fichier à sauvegarder. La valeur token n'est necessaire que si l'authentification est activée.

```json
// Requete
{
    user: "string", // Username
    token: "string",
    data: "string" // File content
}
// Reponse
{
    success: true,
    fileid: "string",
    filename: "string"
}
```

------

`DELETE  /delete/{file}`

Supprime un fichier. Remplacer {file} par l'id du fichier à récupèrer. La valeur token n'est necessaire que si l'authentification est activée.

```json
// Requete
{
    user: "string" // Username
    token: "string"
}
// Reponse
{
    success: true
}
```

