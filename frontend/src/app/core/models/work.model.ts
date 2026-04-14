export interface WorkInfo {
  projectName: string;
  location: string;
  members: string;
  area: string;
  houseType: string;
  layout: string;
}

export interface Work {
  id: number;
  slug: string;
  title: string;
  heroImage: string;
  carouselImages: string[];
  designConcept: string;
  planOriginal: string;
  planFinal: string;
  living3d: string;
  overview3d: string;
  creativeIdeas: string;
  feedback: string;
  info: WorkInfo;
}
