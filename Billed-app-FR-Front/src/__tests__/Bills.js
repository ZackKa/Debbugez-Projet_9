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
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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

  // --------------- Redirection au clic sur "nouvelle note de frais"

  describe("When i click the button 'Nouvelle note de frais'", () => {
    test("Then i redirect to NewBill", () => {

      // On  définit localStorage sur l'objet window grâce à Object.defineProperty.
      // On simule le comportemenent du localStorage avec localStorageMock
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      // On simule qu'un "employee" est connecté
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      // On génère du HTML avec BillsUI avec des données de factures bills.
      const html = BillsUI({ data: bills });
      // On affiche l'interface utilisateur des factures
      document.body.innerHTML = html;

      //ON simule la navigation vers différentes pages.
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      // On crée une instance de Bills, pour simuler la création d'une bill (facture)
      const billsPage = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: localStorageMock,
      })

      // On crée OpenNewBill en utilisant jest initialisée avec handleClickNewBill
      const OpenNewBill = jest.fn(billsPage.handleClickNewBill);
      // On sélectionne le bouton "Nouvelle note de frais" avec le data-testid "btn-new-bill"
      const btnNewBill = screen.getByTestId("btn-new-bill")

      // On ajoute un écouteur d'événements pour déclencher la fonction OpenNewBill
      btnNewBill.addEventListener("click", OpenNewBill)//écoute évènement
      // // On simule le clic en utilisant fireEvent
      fireEvent.click(btnNewBill)
      // On vérifie si la fonction OpenNewBill a été appelée
      expect(OpenNewBill).toHaveBeenCalled()
      // On vérifie si le texte "Envoyer une note de frais" est présent dans le document. Pour verifier la redirection
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })

  // ---------- GET Bills

  describe("When I get bills", () => {
    test("Then the bills should be displayed", async () => {

      // On crée une instance de Bills
      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // On crée getBills à l'aide de Jest et on appelle getBills de l'objet bills
      const getBills = jest.fn(() => bills.getBills());

      // On appelle getBills (manière asynchrone)
      const value = await getBills();

      // On vérifie que la fonction getBills a bien été appelée
      expect(getBills).toHaveBeenCalled();
      // Test si la longeur du tableau (4 factures du __mocks__ store)
      expect(value.length).toBe(4);
    });
  });


  //  Test ERREUR 404 et 500

  describe("When an error occurs", () => {

    beforeEach(() => {
      // On surveille bills du mockstore
      // SpyOn permet de contrôle le comportement de bills et de simuler des réponses spécifiques, comme le rejet d'une promesse avec une erreur 404 ou 500, sans altérer directement l'objet mockStore
      jest.spyOn(mockStore, 'bills')
      // Définition du localStorage avec des données simulées d'un utilisateur connecté
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      )
      // On crée un élément racine dans le document pour l'application
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.appendChild(root)
      // On initialise le routage de l'application
      router()
    })

    test("Then I try to retrieve the bills and a 404 error occurs", async () => {


      // Grâce à mockImplementationOnce de jest, on modifie le comportement du mockStore pour renvoyer une promesse rejetée avec une erreur 404 lors de l'appel à la méthode list.
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      // On simule la navigation vers la page des factures 
      window.onNavigate(ROUTES_PATH.Bills)
      // On attend la présence du message d'erreur "Erreur 404" dans l'interface utilisateur.
      // On attend avec await, l'execution de la fonction au prochain cycle d'exécution (tick)
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Then I try to retrieve the bills and a 500 error occurs", async () => {

      // Grâce à mockImplementationOnce de jest, on modifie le comportement du mockStore pour renvoyer une promesse rejetée avec une erreur 500 lors de l'appel à la méthode list.
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      // On simule la navigation vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills)
      // On attend la présence du message d'erreur "Erreur 500" dans l'interface utilisateur.
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  });
})