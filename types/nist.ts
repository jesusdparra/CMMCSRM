export interface NISTObjective {
  id: string;
  prose: string;
  label: string;
}

export interface NISTControl {
  id: string;
  title: string;
  label: string;
  statement: string;
  objectives: NISTObjective[];
}

export interface NISTFamily {
  id: string;
  title: string;
  label: string;
  controls: NISTControl[];
}

export interface NISTCatalog {
  families: NISTFamily[];
}
