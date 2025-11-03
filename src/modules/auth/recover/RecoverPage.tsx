import {RecoverPasswordSchema} from "./RecoverForm.tsx";
import {APPVersion} from "../../../components/io/output/shared/APPVersion.tsx";

export const RecoverPage = () => {
    return (
        <div className="antialiased flex h-full text-base text-gray-700 dark:bg-coal-500">
            <div className="grid lg:grid-cols-2 grow">
                <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-1">
                    <div className="card max-w-[440px] w-full">
                        <RecoverPasswordSchema/>
                    </div>
                </div>
                <div
                    className="lg:rounded-xl lg:border lg:border-gray-200 lg:m-10 order-1 lg:order-2 bg-top xxl:bg-center xl:bg-cover bg-no-repeat]">
                    <div className="flex flex-col p-8 lg:p-16 gap-4">
                        <img className="h-[600px] max-w-none" src="/banner/login.png" alt={"Login Banner"}/>
                        <div className="flex flex-col gap-3">
                            <h3 className="text-2xl font-semibold text-gray-900">
                                Portal Administrativo AISec
                            </h3>
                            <div className="text-base font-medium text-gray-600">
                                Experiencia Única.
                                <br/>
                                Diseño más
                                <span className="ml-1 text-gray-900 font-semibold">
                                    eficiente.
                                </span>
                                <br/>
                                La seguridad de siempre.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <APPVersion className="fixed bottom-3 left-3"/>
        </div>
    );
};