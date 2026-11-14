import { cleanup, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { post } from "../api";
import { fail, success } from "../lib/result";
import { getToken } from "../lib/token";
import { useAuthStore } from "../stores/auth";
import LoginView from "./LoginView.vue";

vi.mock("../api", () => ({ post: vi.fn() }));

const push = vi.fn();
const query: { redirect?: string } = {};
vi.mock("vue-router", () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query }),
}));

const mockedPost = vi.mocked(post);

const loginSucceeds = () =>
  mockedPost.mockResolvedValue(
    success({
      token: "jwt-fran-api",
      user: {
        id: 1,
        email: "anna@example.com",
        display_name: "Anna",
        role: "member",
        created_at: "",
      },
    }),
  );

const fillAndSubmit = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-post"), "anna@example.com");
  await user.type(screen.getByLabelText("Lösenord"), "hemligt123");
  await user.click(screen.getByRole("button", { name: "Logga in" }));
};

beforeEach(() => {
  setActivePinia(createPinia());
  useAuthStore().logout();
  query.redirect = "/tour/1/upload";
});

afterEach(() => {
  cleanup();
  push.mockClear();
  mockedPost.mockReset();
});

describe("LoginView (M8)", () => {
  it("wrong credentials: the API's error is shown as an alert, no token is stored", async () => {
    mockedPost.mockResolvedValue(
      fail({ message: "fel e-post eller lösenord", status: 401 }),
    );
    render(LoginView);
    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "fel e-post eller lösenord",
    );
    expect(getToken()).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("right credentials: token in memory, never in localStorage, and we go where we were headed", async () => {
    loginSucceeds();
    render(LoginView);
    await fillAndSubmit();

    expect(mockedPost).toHaveBeenCalledWith("/auth/login", {
      email: "anna@example.com",
      password: "hemligt123",
    });
    expect(getToken()).toBe("jwt-fran-api");
    expect(useAuthStore().user?.display_name).toBe("Anna");
    expect(localStorage.length).toBe(0);
    expect(push).toHaveBeenCalledWith("/tour/1/upload");
  });

  it.each(["//evil.example", "https://evil.example"])(
    "ignores a 'redirect' that is not a relative path (%s)",
    async (redirect) => {
      query.redirect = redirect;
      loginSucceeds();
      render(LoginView);
      await fillAndSubmit();

      expect(push).toHaveBeenCalledWith("/");
    },
  );
});
