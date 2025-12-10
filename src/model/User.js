
export class User {

    constructor(_id, username) {
        this._id = _id;
        this.username = username;
    }

    // Se necessário, você pode adicionar métodos de validação ou formatação aqui.
    get displayUsername() {
        return `@${this.username}`;
    }
}

// Em JavaScript puro, a interface é substituída pela documentação (JSDoc)
// e a classe garante a estrutura esperada.