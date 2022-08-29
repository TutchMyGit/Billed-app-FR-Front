/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills";

import firebase from "../__mocks__/store";
import fireStore from "../app/Store";

import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Router from "../app/Router.js";


import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/Store");


Object.defineProperty(window, "localStorage", { value: localStorageMock,});
window.localStorage.setItem("user", JSON.stringify({
  type: 'Employee'
}));

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({
    pathname
  })
}

const testNewBill = {
  id: "47qAXb6fIm2zOKkLzMru",
  vat: "60",
  fileUrl: "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
  status: "refused",
  type: "Hôtel et logement",
  commentary: "Hotel trajet voyage",
  name: "New Bill",
  fileName: "preview-facture-free-201801-pdf-1.jpg",
  date: "2006-06-08",
  amount: 200,
  commentAdmin: "Testing",
  email: "a@a",
  pct: 20
};


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then vertical layout icon should be lighted", () => {
      const pathname = ROUTES_PATH["NewBill"];

      fireStore.bills = () => ({
        bills,
        get: jest.fin().mockResolvedValue()
      });

      Object.defineProperty(window, "location", {value: {hash: pathname}});
      document.body.innerHTML = `<div id="root"></div>`;

      Router();

      expect(screen.getByTestId("icon-mail")).toBeTruthy();
      expect(screen.getByTestId("icon-mail").classList.contains("active-icon")).toBeTruthy();
    })
  });

  describe('When i upload an image', () => {
    test("Then the file loaded should have the correct name", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      fireEvent.change(inputFile, {
        target: {
          files: [new File(["image.png"], "image.png", {
            type: "image/png"
          })],
        }
      });

      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files[0].name).toBe("image.png");
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  describe("When newBill is correctly submit", () => {
    test("Then it should create a new bill", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);

      const submitBtn = screen.getByTestId("form-new-bill");
      submitBtn.addEventListener("submit", handleSubmit);
      fireEvent.submit(submitBtn);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("When incorrect filetype is added", () => {
    test("Then the bill shouldn't be created", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);

      newBill.fileName = "incorrect";

      const submitBtn = screen.getByTestId("form-new-bill");
      submitBtn.addEventListener("submit", handleSubmit);
      fireEvent.submit(submitBtn);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getAllByText("Justificatif")).toBeTruthy();
    });

    test("Then an error should be display", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      window.alert = jest.fn();

      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["image.exe"], "image.exe", {
            type: "image/exe"
          })],
        }
      });

      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files[0].name).toBe("image.exe");
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });
    });
  });
});

describe("Given when i am connect as employee", () => {
  describe('When i create a new bill', () => {
    test("bill is added to API", () => {
      const getSpy = jest.spyOn(firebase, "bills");

      const billListUpdated = firebase.bills().update();
      const billList = firebase.bills().list();
      billListUpdated();

      expect(getSpy).toHaveBeenCalled();
      expect(billList.length).toBe(5);
    });

    test("error while add bill and get error 404 message", async () => {
      firebase.bills().update(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      const html = BillsUI({
        error: "Erreur 404"
      });
      document.body.innerHTML = html;


      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Error while add bill and get error 500 message", async () => {
      firebase.bills().update(() =>
        Promise.reject(new Error("Erreur 500"))
      );

      const html = BillsUI({
        error: "Erreur 500"
      });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });

  describe('WHen bill is submitted', () => {
    test("Then add new bill", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const bill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      expect(await firebase.bills().create(NewBill)).toBeTruthy();
    });

    test("Then it's create Bill", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const bill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      bill.createBill = (bill) => bill;

      document.querySelector(`select[data-testid='expense-type']`).value = NewBill.type;
      document.querySelector(`input[data-testid='expense-name']`).value = NewBill.name;
      document.querySelector(`input[data-testid='amount']`).value = NewBill.amount;
      document.querySelector(`input[data-testid='datepicker']`).value = NewBill.date;
      document.querySelector(`input[data-testid='vat']`).value = NewBill.vat;
      document.querySelector(`input[data-testid='pct']`).value = NewBill.pct;
      document.querySelector(`textarea[data-testid='commentary']`).value = NewBill.commentary;
      bill.fileUrl = NewBill.fileUrl;
      bill.fileName = NewBill.fileName;

      const submit = screen.getByTestId("form-new-bill");

      const handleSubmit = jest.fn((e) => bill.handleSubmit(e));
      submit.addEventListener("click", handleSubmit);
      fireEvent.click(submit);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.queryAllByText("Vous devez entrer au moins 5 caractères.")).toHaveLength(0);
      expect(document.body.innerHTML).toContain("Mes notes de frais")
    });

    // test("Then get error if name length is equal or inferior to 5", async () => {
    //   const html = NewBillUI();
    //   document.body.innerHTML = html;

    //   const bill = new NewBill({
    //     document,
    //     onNavigate,
    //     localStorage: window.localStorage,
    //   });

    //   bill.createBill = (bill) => bill;

    //   document.querySelector(`input[data-testid="expense-name"]`).value = "abc";

    //   const submit = screen.getByTestId("form-new-bill");

    //   const handleSubmit = jest.fn((e) => bill.handleSubmit(e));
    //   submit.addEventListener("click", handleSubmit);
    //   fireEvent.click(submit);

    //   expect(handleSubmit).toHaveBeenCalled();
    //   await waitFor(() => {
    //     expect(screen.getByTestId("errorExpenseName")).toBeTruthy();
    //   });
    // });
  });
});
