import {mixed, object, ObjectSchema, string} from "yup";
import {GradeType, SpecializationFormValues} from "../domain/model/course/Course.ts";
import {Messages} from "../domain/types/Messages.ts";

export const SpecializationSchema: ObjectSchema<SpecializationFormValues> = object().shape({
    name: string().min(8, Messages.MinLengthOf8)
        .max(64, Messages.LengthOfN(64))
        .required(Messages.RequiredField),
    description: string().min(20, Messages.MinLengthOf20)
        .max(200, Messages.LengthOfN(200))
        .optional(),
    type: mixed<GradeType>()
        .oneOf(Object.values(GradeType), Messages.InvalidGradeType)
        .required(Messages.RequiredField),
})