
export class User {

    constructor(_id, username) {
        this._id = _id;
        this.username = username;
    }

    get displayUsername() {
        return `@${this.username}`;
    }
}
