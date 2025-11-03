import {KTMenu} from "./menu";
import {KTDropdown} from "./dropdown";
import {KTModal} from "./modal";
import {KTDrawer} from "./drawer";
import {KTCollapse} from "./collapse";
import {KTDismiss} from "./dismiss";
import {KTTabs} from "./tabs";
import {KTAccordion} from "./accordion";
import {KTScrollspy} from "./scrollspy";
import {KTScrollable} from "./scrollable";
import {KTScrollto} from "./scrollto";
import {KTSticky} from "./sticky";
import {KTReparent} from "./reparent";
import {KTToggle} from "./toggle";
import {KTTooltip} from "./tooltip";
import {KTStepper} from "./stepper";
import {KTImageInput} from "./image-input";
import {KTTogglePassword} from "./toggle-password";
import {KTDataTable} from "./datatable";
import KTDom from "../helpers/dom.ts";
import KTEventHandler from "../helpers/event-handler.ts";
import KTUtils from "../helpers/utils.ts";
import {KTTheme} from "./theme/theme.ts";

const KTComponents = {
    init(): void {
        KTMenu.init();
        KTDropdown.init();
        KTModal.init();
        KTDrawer.init();
        KTCollapse.init();
        KTDismiss.init();
        KTTabs.init();
        KTAccordion.init();
        KTScrollspy.init();
        KTScrollable.init();
        KTScrollto.init();
        KTSticky.init();
        KTReparent.init();
        KTToggle.init();
        KTTooltip.init();
        KTStepper.init();
        KTTheme.init();
        KTImageInput.init();
        KTTogglePassword.init();
        KTDataTable.init();
    }
};

declare global {
    interface Window {
        KTUtils: typeof KTUtils;
        KTDom: typeof KTDom;
        KTEventHandler: typeof KTEventHandler;
        KTMenu: typeof KTMenu;
        KTDropdown: typeof KTDropdown;
        KTModal: typeof KTModal;
        KTDrawer: typeof KTDrawer;
        KTCollapse: typeof KTCollapse;
        KTDismiss: typeof KTDismiss;
        KTTabs: typeof KTTabs;
        KTAccordion: typeof KTAccordion;
        KTScrollspy: typeof KTScrollspy;
        KTScrollable: typeof KTScrollable;
        KTScrollto: typeof KTScrollto;
        KTSticky: typeof KTSticky;
        KTReparent: typeof KTReparent;
        KTToggle: typeof KTToggle;
        KTTooltip: typeof KTTooltip;
        KTStepper: typeof KTStepper;
        KTTheme: typeof KTTheme;
        KTImageInput: typeof KTImageInput;
        KTTogglePassword: typeof KTTogglePassword;
        KTDataTable: typeof KTDataTable;
        KTComponents: typeof KTComponents;
    }
}

window.KTUtils = KTUtils;
window.KTDom = KTDom;
window.KTEventHandler = KTEventHandler;
window.KTMenu = KTMenu;
window.KTDropdown = KTDropdown;
window.KTModal = KTModal;
window.KTDrawer = KTDrawer;
window.KTCollapse = KTCollapse;
window.KTDismiss = KTDismiss;
window.KTTabs = KTTabs;
window.KTAccordion = KTAccordion;
window.KTScrollspy = KTScrollspy;
window.KTScrollable = KTScrollable;
window.KTScrollto = KTScrollto;
window.KTSticky = KTSticky;
window.KTReparent = KTReparent;
window.KTToggle = KTToggle;
window.KTTooltip = KTTooltip;
window.KTStepper = KTStepper;
window.KTTheme = KTTheme;
window.KTImageInput = KTImageInput;
window.KTTogglePassword = KTTogglePassword;
window.KTDataTable = KTDataTable;
window.KTComponents = KTComponents;

export default KTComponents;

KTDom.ready(() => {
    KTComponents.init();
});
