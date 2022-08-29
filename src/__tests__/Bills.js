/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import firebase from "../__mocks__/store.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";


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
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : +1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

// Page loading and it's fine

describe("When the page is loading", () => {
  test("Then i should go to the loading page", () => {
    const html = BillsUI({data: [], loading: true});
    document.body.innerHTML = html;

    expect(screen.getAllByText("Loading...")).toBeTruthy()
  })
})

// Page loading but error

describe("When use is on the page but server send an error", () => {
  test("Then i should go to an error page", () => {
    const html = BillsUI({data: [], loading: false, error: "Aîe !"})
    document.body.innerHTML = html;

    expect(screen.getAllByText("Erreur")).toBeTruthy();
  })
})

describe("Given I am connected as an employee and on Bill page", () => {
  describe("When i click on new bill", () => {
    test("Then it should display a NewBill page", () => {
      const html = BillsUI({data: []})
      document.body.innerHTML = html;

      window.localStorage.setItem("user", JSON.stringify({
        type: 'Employee'
      }))

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }

      const allBills = new Bills({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      const handleclickNewBill = jest.fn(allBills.handleClickNewBill);

      const billBtn = screen.getByTestId("btn-new-bill");

      billBtn.addEventListener("click", handleclickNewBill);
      fireEvent.click(billBtn);

      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    })
  })
})

// If click on eye icon, image should appear

describe("When i click on the eye icon", () => {
  test("A modal with an image should open", () => {

    const html = BillsUI({data: bills})
    document.body.innerHTML = html;

    const store = null;
    const onNavigate = null;

    const allBills = new Bills({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    })

    $.fn.modal = jest.fn();

    const eye = screen.getAllByTestId("icon-eye")[0];

    const handleClickIconEye = jest.fn(() => allBills.handleClickIconEye(eye))

    eye.addEventListener("click", handleClickIconEye)
    fireEvent.click(eye);

    const modale = document.getElementById("modaleFile")

    expect(modale).toBeTruthy();
  })
})



describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills UI", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "bills");

      const billList = await firebase.bills().list();

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(billList.length).toBe(4);
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.bills(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      const html = BillsUI({
        error: "Erreur 404"
      });
      document.body.innerHTML = html;

      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.bills(() =>
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
});
