
import { UserAccount, SavedPatient } from '../types';
import { db as firestore, auth, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from '../firebase';

export const DEFAULT_ADMIN: UserAccount = {
  username: 'admin',
  password: '', 
  role: 'admin',
  createdAt: Date.now()
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const db = {
  users: {
    getAll: async (): Promise<UserAccount[]> => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'users'));
        const users: UserAccount[] = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data() as UserAccount);
        });
        return users.length > 0 ? users : [DEFAULT_ADMIN];
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'users');
        return [DEFAULT_ADMIN];
      }
    },
    add: async (user: UserAccount & { uid: string }): Promise<boolean> => {
      try {
        await setDoc(doc(firestore, 'users', user.uid), user);
        return true;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        return false;
      }
    },
    delete: async (uid: string): Promise<boolean> => {
      try {
        await deleteDoc(doc(firestore, 'users', uid));
        return true;
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${uid}`);
        return false;
      }
    }
  },
  patients: {
    getAll: async (): Promise<SavedPatient[]> => {
      try {
        if (!auth.currentUser) return [];
        const q = query(collection(firestore, 'patients'), where('authorUid', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const patients: SavedPatient[] = [];
        querySnapshot.forEach((doc) => {
          patients.push(doc.data() as SavedPatient);
        });
        return patients;
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'patients');
        return [];
      }
    },
    add: async (patient: SavedPatient) => {
      try {
        if (!auth.currentUser) throw new Error("Not authenticated");
        const patientWithAuth = { ...patient, authorUid: auth.currentUser.uid };
        await setDoc(doc(firestore, 'patients', patient.id), patientWithAuth);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `patients/${patient.id}`);
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(firestore, 'patients', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `patients/${id}`);
      }
    }
  }
};
