export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  spaceType: string;
  budget: string;
  square?: string;
  wt?: string;
  message: string;
}

export interface ContactResponse {
  message: string;
  id: number;
}
