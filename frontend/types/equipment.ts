// frontend/types/equipment.ts

export interface EquipmentDetails {
  id: number;
  inventoryNumber: string;
  name: string;
  type: string;
  macAddress?: string;
  ipAddress?: string;
  login?: string;
  password?: string;
  location: string;
  floor?: string;
  cabinet?: string;
  createdAt: string;
  fileUrls: string[];

  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    department?: string;
  } | null;
}

export interface Equipment {
  id: number;
  name: string;
  inventoryNumber: string;
}
