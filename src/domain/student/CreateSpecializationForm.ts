import {GradeType} from "../model/course/Course.ts";

export interface CreateSpecializationForm {
  name: string;
  description: string;
  type: GradeType;
}
