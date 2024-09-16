/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    test("Then the form should display correctly", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Vérifier si le formulaire est présent
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();

      // Vérifier si les champs de saisie sont présents
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();

      // Vérifier si le bouton d'envoi est présent
      expect(document.getElementById("btn-send-bill")).toBeTruthy();
    });

    // Vérifier si l'icône est actif
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // On simule le comportemenent du localStorage avec localStorageMock
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      // On simule qu'un "employee" est connecté
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      // On crée une div et l'ajoute au body
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      // Router gére la navigation
      router()
      // On simule la navigation vers NewBill
      window.onNavigate(ROUTES_PATH.NewBill)
      // On attend que l'icône soit affichée
      await waitFor(() => screen.getByTestId('icon-mail'))
      // On vérifie que l'icône est en surbrillance avec la présence de la class
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains("active-icon")).toBe(true);
    })
  })

  describe("When I upload a file in the wrond format", () => {

    // Vérifier si le mauvais format ne se télécharge pas
    test("Then a file should not be uploaded", () => {
      // On simule le comportemenent du localStorage avec localStorageMock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      // On simule qu'un "employee" est connecté
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      // On génère l'interface utilisateur
      const html = NewBillUI();
      document.body.innerHTML = html;
      // On met à jour le contenue du document avec le chemin
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // On crée une instance de Bills, pour simuler la création d'une bill (facture)
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // On appelle handleChangeFile de newBill
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      // On écoute l'événement change
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);

      window.alert = jest.fn();

      // On simule le changement de fichier en créant un nouveau fichier pdf
      fireEvent.change(file, {
        target: {
          files: [new File(["image.pdf"], "image.pdf", { type: "file/pdf" })],
        },
      });

      // On véerifie que l'alerte à été émise
      expect(window.alert).toHaveBeenCalled();
      // On vérifie l'appel à la fonction
      expect(handleChangeFile).toHaveBeenCalled();
      // On vérifie que le nom et le type du fichier téléversé correspondent à ceux attendus
      expect(file.files[0].name).toBe("image.pdf");
      expect(file.files[0].type).toBe("file/pdf");
      // On vérifie que la propriété pictureTypeValid de l'instance de NewBill est undefined.
      // expect(newBill.pictureTypeValid).toBe(undefined);
    });
  })

  // Test POST
  describe("When I submit form valid", () => {
    test("Then call api update bills", async () => {

      // On espionne les appels à la méthode bills du mockstore
      jest.spyOn(mockStore, "bills");
      // On simule le comportemenent du localStorage avec localStorageMock
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      // On simule qu'un "employee" est connecté
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      // L'interface utilisateur de la page NewBill est générée et affichée.
      const html = NewBillUI();
      document.body.innerHTML = html;
      // On simule la navigation en mettant à jour le contenu de la page.
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // On crée une instance de Bills, pour simuler la création d'une bill (facture)
      // Le store est défini à mockstore pour simuler des données
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localeStorage: localStorageMock,
      });
      // Un gestionnaire handleSubmit est créé en tant que fonction de simulation pour la soumission du formulaire.
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      // On ajoute n écouteur d'événement
      form.addEventListener("submit", handleSubmit);
      // On simule l'événement
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      // On verifie que la méthode bills du mockstore a été appelée
      expect(mockStore.bills).toHaveBeenCalled();
    });
  });
})

// Test erreur 404 et 500
describe("When I am connected as an Employee", () => {
  // Étant donné qu'une erreur survient lors de l'ajout d'une note de frais via l'API
  describe("When an error occurs", () => {

    beforeEach(() => {      
      // On simule le comportemenent du localStorage avec localStorageMock
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      // On défini le localStorage avec des données simulées d'un utilisateur connecté
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // On initialise l'interface utilisateur de la page NewBill et on l'ajoute au corp
      document.body.innerHTML = NewBillUI();

      // On simule la navigation en mettant à jour le contenu de la page
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    })

    // Test pour vérifier qu'une erreur 404 est correctement gérée
    test("Then I try to add bills and a 404 error occurs", async () => {

      // La méthode console.error est espionnée pour vérifier si elle est appelée
      const postSpy = jest.spyOn(console, "error");

      // Une instance de NewBill est créée avec un store simulé qui renvoie une erreur 404 lors de la mise à jour
      const newBill = new NewBill({
        document,
        onNavigate,
        store: {
          bills: jest.fn(() => newBill.store), // renvoie le store mocké
          create: jest.fn(() => Promise.resolve({})), // renvoie objet vide (mock)
          update: jest.fn(() => Promise.reject(new Error("404"))), // renvoie promesse rejetée avec erreur 404 (mock)
        },
        localeStorage: localStorageMock,
      });
      // La variable validImage est définie à true pour simuler une image valide
      newBill.validImage = true;

      const form = screen.getByTestId("form-new-bill");      
      // On appelle la méthode handleSubmit de l'objet newBill
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      // On ajoute un écouteur d'événement
      form.addEventListener("submit", handleSubmit);

      // On simule la soumission du formulaire
      fireEvent.submit(form);
      // On attend la fin du traitement asynchrone
      // On attend avec await, l'execution de la fonction au prochain cycle d'exécution (tick)
      await new Promise(process.nextTick);
      // Vérifier que console.error a été appelée avec l'erreur 404 en argument
      expect(postSpy).toHaveBeenCalledWith(new Error("404"));
    });

    // Test pour vérifier qu'une erreur 500 est correctement gérée
    test("Then I try to add bills and a 500 error occurs", async () => {      
      
      // La méthode console.error est espionnée pour vérifier si elle est appelée
      const postSpy = jest.spyOn(console, "error");

      // Une instance de NewBill est créée avec un store simulé qui renvoie une erreur 500 lors de la mise à jour
      const newBill = new NewBill({
        document,
        onNavigate,
        store: {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("500"))),
        },
        localStorage,
      });
      // La variable validImage est définie à true pour simuler une image valide
      newBill.validImage = true;

      // Obtenir le formulaire et ajouter un écouteur d'événement pour la soumission
      const form = screen.getByTestId("form-new-bill");
      // On appelle la méthode handleSubmit de l'objet newBill
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      // On ajoute un écouteur d'événement
      form.addEventListener("submit", handleSubmit);

      // On simule la soumission du formulaire
      fireEvent.submit(form);
      // On attend la fin du traitement asynchrone
      await new Promise(process.nextTick);
      // Vérifier que console.error a été appelée avec l'erreur 500
      expect(postSpy).toHaveBeenCalledWith(new Error("500"));
    });
  });
});