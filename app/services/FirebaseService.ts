import  admin from '#start/firebase';

class FirebaseService {
  /**
   * Initialise le service Firebase avec les clés d'administration.
   * @param {Object} serviceAccountKey - Les clés du compte de service Firebase.
   */
  // static initialize(serviceAccountKey: admin.ServiceAccount) {
  //   if (!admin.apps.length) {
  //     admin.initializeApp({
  //       credential: admin.credential.cert(serviceAccountKey),
  //     });
  //   }
  // }
  static async checkIfUserExists(phoneNumber: string): Promise<admin.auth.UserRecord | null> {
    try {
      const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
      return userRecord;  // Retourne l'utilisateur si trouvé
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;  // Aucun utilisateur trouvé
      }
      throw error;  // Lancer l'erreur si autre
    }
  }

  static async checkIfUidExists(uid: string): Promise<admin.auth.UserRecord | null> {
    try {
      // Utilisation de getUser pour récupérer un utilisateur par son UID
      const userRecord = await admin.auth().getUser(uid);
      return userRecord;  // Retourne l'utilisateur si trouvé
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;  // Aucun utilisateur trouvé avec l'UID donné
      }
      throw error;  // Lancer l'erreur si autre type d'erreur
    }
  }
  /**
   * Crée un utilisateur dans Firebase Authentication et retourne l'uid.
   * @param {string} phoneNumber - Le numéro de téléphone au format international (ex. "+11234567890").
   * @returns {Promise<string>} - L'uid de l'utilisateur créé.
   */
  static async sendOtp(phoneNumber: string): Promise<string> {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await FirebaseService.checkIfUserExists(phoneNumber);
      if (existingUser) {
        console.log(`L'utilisateur avec le numéro ${phoneNumber} existe déjà.`);
        return existingUser.uid;  // Retourner l'UID de l'utilisateur existant
      }

      // Créer un nouvel utilisateur si aucun utilisateur n'est trouvé
      const userRecord: admin.auth.UserRecord = await admin.auth().createUser({
        phoneNumber,
      });
      console.log(userRecord);

      // Retourner l'UID de l'utilisateur créé
      return userRecord.uid;
    } catch (error) {
      console.error('Erreur lors de la création de l’utilisateur :', error.message);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
}

export default FirebaseService;
