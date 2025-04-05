// utilisateur.model.ts
export class Utilisateur {
  id: number;
  nom: string;
  email: string;
  mdp: string;

  constructor(data: Partial<Utilisateur> = {}) {
    this.id = data.id || 0;
    this.nom = data.nom || '';
    this.email = data.email || '';
    this.mdp = data.mdp || '';
  }

  // Méthodes définies dans le diagramme
  sInscrire(nom: string, email: string, mdp: string): boolean {
    // Logique d'inscription
    return true;
  }

  seConnecter(email: string, mdp: string): boolean {
    // Logique de connexion
    return true;
  }

  modifierProfil(nom: string, email: string, mdp: string): void {
    // Logique de modification du profil
    this.nom = nom;
    this.email = email;
    this.mdp = mdp;
  }

  supprimerCompte(): void {
    // Logique de suppression du compte
  }
}

// Admin hérite d'Utilisateur
export class Admin extends Utilisateur {
  constructor(data: Partial<Admin> = {}) {
    super(data);
  }

  creerUtilisateur(): void {
    // Logique de création d'utilisateur
  }

  supprimerUser(): void {
    // Logique de suppression d'utilisateur
  }

  publierTest(): void {
    // Logique de publication de test
  }

  creerTest(): void {
    // Logique de création de test
  }

  modifierTest(): void {
    // Logique de modification de test
  }
}

// Candidat hérite d'Utilisateur
export class Candidat extends Utilisateur {
  constructor(data: Partial<Candidat> = {}) {
    super(data);
  }

  passerTest(): void {
    // Logique pour passer un test
  }

  voirResultats(): void {
    // Logique pour voir les résultats
  }

  consulterTests(): void {
    // Logique pour consulter les tests disponibles
  }
}

// RH hérite d'Utilisateur
export class RH extends Utilisateur {
  constructor(data: Partial<RH> = {}) {
    super(data);
  }

  creerTest(): void {
    // Logique de création de test
  }

  modifierTest(): void {
    // Logique de modification de test
  }

  ajouterQuestion(): void {
    // Logique d'ajout de question
  }
}
