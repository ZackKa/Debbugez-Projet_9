/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      // Bug 5 fix
      expect(windowIcon.classList.contains("active-icon")).toBe(true);

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // ---------- Ouverture modal

  describe("When I click on on eye Button", () => {
    test("Then modal should open", async () => {

      // On  définit localStorage sur l'objet window grâce à Object.defineProperty.
      // On simule le comportemenent du localStorage avec localStorageMock
      Object.defineProperty(window, localStorage, { value: localStorageMock });

      // On simule qu'un "employee" est connecté
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      // On génère du HTML avec BillsUI avec des données de factures bills.
      const html = BillsUI({ data: bills });
      // On affiche l'interface utilisateur des factures
      document.body.innerHTML = html;

      // On simule la navigation vers différentes pages
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // On crée une instance de Bills, pour simuler la création d'une bill (facture)
      const billsContainer = new Bills({
        document,
        onNavigate,
        localStorage: localStorageMock,
        store: null,
      });

      // On remplace la méthode modal de jQuery par une fonction créée par Jest. On simule le comportement de modal
      $.fn.modal = jest.fn();

      //On déclare handleClickIconEye qui est initialisée avec une nouvelle fonction créée par Jest.
      const handleClickIconEye = jest.fn(() => {
        billsContainer.handleClickIconEye;
      });

      // On sélectionne le premier icon-eye
      const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
      // On ajoute un écouteur d'événements
      firstEyeIcon.addEventListener("click", handleClickIconEye);
      // On simule le clic en utilisant fireEvent (clic artificielle)
      fireEvent.click(firstEyeIcon);

      // On verifie si handleClickIconEye a été appelée lors du clic
      expect(handleClickIconEye).toHaveBeenCalled();
      // On verifie sur la méthode modal a été appelée pour verifier si la modal a été ouverte
      expect($.fn.modal).toHaveBeenCalled();

    })
  })


})
