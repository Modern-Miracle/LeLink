export type RecordType = "examination" | "lab" | "imaging" | "prescription";

export type RecordItem = {
  type: RecordType;
  title: string;
  date: string;
  performer?: string;
  resource: any;
};
