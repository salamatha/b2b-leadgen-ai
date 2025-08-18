/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./components/Header.tsx":
/*!*******************************!*\
  !*** ./components/Header.tsx ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Header)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/link */ \"./node_modules/next/link.js\");\n/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/auth */ \"./lib/auth.tsx\");\n\n\n\n\nfunction isPrivatePath(pathname) {\n    return pathname === \"/dashboard\" || pathname.startsWith(\"/dashboard/\") || pathname === \"/agents\";\n}\nfunction Header() {\n    const { authed, signOut } = (0,_lib_auth__WEBPACK_IMPORTED_MODULE_3__.useAuth)();\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"header\", {\n        className: \"border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60\",\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"container flex items-center justify-between py-3\",\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {\n                    href: \"/\",\n                    className: \"font-serif text-xl text-brand-900\",\n                    children: \"B2B Leadgen AI\"\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n                    lineNumber: 16,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"flex items-center gap-3\",\n                    children: [\n                        authed && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {\n                            href: \"/agents\",\n                            className: \"text-sm text-slate-700 hover:text-brand-900\",\n                            children: \"Agents\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n                            lineNumber: 19,\n                            columnNumber: 22\n                        }, this),\n                        !authed ? /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {\n                                    href: \"/auth/signin\",\n                                    className: \"btn btn-secondary\",\n                                    children: \"Sign in\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n                                    lineNumber: 23,\n                                    columnNumber: 15\n                                }, this),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {\n                                    href: \"/auth/signup\",\n                                    className: \"btn btn-primary\",\n                                    children: \"Sign up\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n                                    lineNumber: 24,\n                                    columnNumber: 15\n                                }, this)\n                            ]\n                        }, void 0, true) : /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n                            children: [\n                                !isPrivatePath(router.pathname) && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_link__WEBPACK_IMPORTED_MODULE_1___default()), {\n                                    href: \"/dashboard\",\n                                    className: \"btn btn-secondary\",\n                                    children: \"Dashboard\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n                                    lineNumber: 29,\n                                    columnNumber: 17\n                                }, this),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                    onClick: signOut,\n                                    className: \"btn btn-primary\",\n                                    children: \"Sign out\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n                                    lineNumber: 31,\n                                    columnNumber: 15\n                                }, this)\n                            ]\n                        }, void 0, true)\n                    ]\n                }, void 0, true, {\n                    fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n                    lineNumber: 18,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n            lineNumber: 15,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\components\\\\Header.tsx\",\n        lineNumber: 14,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb21wb25lbnRzL0hlYWRlci50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQTZCO0FBQ1c7QUFDRjtBQUV0QyxTQUFTRyxjQUFjQyxRQUFnQjtJQUNyQyxPQUFPQSxhQUFhLGdCQUFnQkEsU0FBU0MsVUFBVSxDQUFDLGtCQUFrQkQsYUFBYTtBQUN6RjtBQUVlLFNBQVNFO0lBQ3RCLE1BQU0sRUFBRUMsTUFBTSxFQUFFQyxPQUFPLEVBQUUsR0FBR04sa0RBQU9BO0lBQ25DLE1BQU1PLFNBQVNSLHNEQUFTQTtJQUV4QixxQkFDRSw4REFBQ1M7UUFBT0MsV0FBVTtrQkFDaEIsNEVBQUNDO1lBQUlELFdBQVU7OzhCQUNiLDhEQUFDWCxrREFBSUE7b0JBQUNhLE1BQUs7b0JBQUlGLFdBQVU7OEJBQW9DOzs7Ozs7OEJBRTdELDhEQUFDQztvQkFBSUQsV0FBVTs7d0JBQ1pKLHdCQUFVLDhEQUFDUCxrREFBSUE7NEJBQUNhLE1BQUs7NEJBQVVGLFdBQVU7c0NBQThDOzs7Ozs7d0JBRXZGLENBQUNKLHVCQUNBOzs4Q0FDRSw4REFBQ1Asa0RBQUlBO29DQUFDYSxNQUFLO29DQUFlRixXQUFVOzhDQUFvQjs7Ozs7OzhDQUN4RCw4REFBQ1gsa0RBQUlBO29DQUFDYSxNQUFLO29DQUFlRixXQUFVOzhDQUFrQjs7Ozs7Ozt5REFHeEQ7O2dDQUNHLENBQUNSLGNBQWNNLE9BQU9MLFFBQVEsbUJBQzdCLDhEQUFDSixrREFBSUE7b0NBQUNhLE1BQUs7b0NBQWFGLFdBQVU7OENBQW9COzs7Ozs7OENBRXhELDhEQUFDRztvQ0FBT0MsU0FBU1A7b0NBQVNHLFdBQVU7OENBQWtCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBT3BFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYjJiLWxlYWRnZW4tZnJvbnRlbmQvLi9jb21wb25lbnRzL0hlYWRlci50c3g/MDM2OCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTGluayBmcm9tIFwibmV4dC9saW5rXCI7XG5pbXBvcnQgeyB1c2VSb3V0ZXIgfSBmcm9tIFwibmV4dC9yb3V0ZXJcIjtcbmltcG9ydCB7IHVzZUF1dGggfSBmcm9tIFwiLi4vbGliL2F1dGhcIjtcblxuZnVuY3Rpb24gaXNQcml2YXRlUGF0aChwYXRobmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiBwYXRobmFtZSA9PT0gXCIvZGFzaGJvYXJkXCIgfHwgcGF0aG5hbWUuc3RhcnRzV2l0aChcIi9kYXNoYm9hcmQvXCIpIHx8IHBhdGhuYW1lID09PSBcIi9hZ2VudHNcIjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gSGVhZGVyKCkge1xuICBjb25zdCB7IGF1dGhlZCwgc2lnbk91dCB9ID0gdXNlQXV0aCgpO1xuICBjb25zdCByb3V0ZXIgPSB1c2VSb3V0ZXIoKTtcblxuICByZXR1cm4gKFxuICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiYm9yZGVyLWIgYmctd2hpdGUvNzAgYmFja2Ryb3AtYmx1ciBzdXBwb3J0cy1bYmFja2Ryb3AtZmlsdGVyXTpiZy13aGl0ZS82MFwiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb250YWluZXIgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHB5LTNcIj5cbiAgICAgICAgPExpbmsgaHJlZj1cIi9cIiBjbGFzc05hbWU9XCJmb250LXNlcmlmIHRleHQteGwgdGV4dC1icmFuZC05MDBcIj5CMkIgTGVhZGdlbiBBSTwvTGluaz5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAge2F1dGhlZCAmJiA8TGluayBocmVmPVwiL2FnZW50c1wiIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1zbGF0ZS03MDAgaG92ZXI6dGV4dC1icmFuZC05MDBcIj5BZ2VudHM8L0xpbms+fVxuXG4gICAgICAgICAgeyFhdXRoZWQgPyAoXG4gICAgICAgICAgICA8PlxuICAgICAgICAgICAgICA8TGluayBocmVmPVwiL2F1dGgvc2lnbmluXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1zZWNvbmRhcnlcIj5TaWduIGluPC9MaW5rPlxuICAgICAgICAgICAgICA8TGluayBocmVmPVwiL2F1dGgvc2lnbnVwXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCI+U2lnbiB1cDwvTGluaz5cbiAgICAgICAgICAgIDwvPlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8PlxuICAgICAgICAgICAgICB7IWlzUHJpdmF0ZVBhdGgocm91dGVyLnBhdGhuYW1lKSAmJiAoXG4gICAgICAgICAgICAgICAgPExpbmsgaHJlZj1cIi9kYXNoYm9hcmRcIiBjbGFzc05hbWU9XCJidG4gYnRuLXNlY29uZGFyeVwiPkRhc2hib2FyZDwvTGluaz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtzaWduT3V0fSBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIj5TaWduIG91dDwvYnV0dG9uPlxuICAgICAgICAgICAgPC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2hlYWRlcj5cbiAgKTtcbn1cbiJdLCJuYW1lcyI6WyJMaW5rIiwidXNlUm91dGVyIiwidXNlQXV0aCIsImlzUHJpdmF0ZVBhdGgiLCJwYXRobmFtZSIsInN0YXJ0c1dpdGgiLCJIZWFkZXIiLCJhdXRoZWQiLCJzaWduT3V0Iiwicm91dGVyIiwiaGVhZGVyIiwiY2xhc3NOYW1lIiwiZGl2IiwiaHJlZiIsImJ1dHRvbiIsIm9uQ2xpY2siXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./components/Header.tsx\n");

/***/ }),

/***/ "./lib/auth.tsx":
/*!**********************!*\
  !*** ./lib/auth.tsx ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),\n/* harmony export */   useAuth: () => (/* binding */ useAuth)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nconst Ctx = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(null);\nfunction AuthProvider({ children }) {\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();\n    const [token, setTokenState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [userId, setUserId] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const authed = !!token;\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        const t =  false ? 0 : null;\n        const uid =  false ? 0 : null;\n        setTokenState(t);\n        setUserId(uid);\n        const onStorage = (e)=>{\n            if (e.key === \"token\" || e.key === \"userId\") {\n                const nt = localStorage.getItem(\"token\");\n                const nuid = localStorage.getItem(\"userId\");\n                setTokenState(nt);\n                setUserId(nuid);\n            }\n        };\n        window.addEventListener(\"storage\", onStorage);\n        return ()=>window.removeEventListener(\"storage\", onStorage);\n    }, []);\n    const setToken = (t, uid)=>{\n        setTokenState(t);\n        if (t) localStorage.setItem(\"token\", t);\n        else localStorage.removeItem(\"token\");\n        if (uid !== undefined) {\n            setUserId(uid);\n            if (uid) localStorage.setItem(\"userId\", uid);\n            else localStorage.removeItem(\"userId\");\n        }\n    };\n    const signIn = (t, uid)=>{\n        setToken(t, uid);\n    };\n    const signOut = ()=>{\n        setToken(null, null);\n        // redirect to signin from private areas\n        // always send user to Home after logout\n        window.location.href = \"/\"; // 👈 redirect to Home\n        if (router.pathname.startsWith(\"/dashboard\") || router.pathname === \"/agents\") {\n            router.replace(\"/auth/signin\");\n        } else {\n            router.replace(router.pathname);\n        }\n    };\n    const value = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(()=>({\n            authed,\n            token,\n            userId,\n            setToken,\n            signIn,\n            signOut\n        }), [\n        authed,\n        token,\n        userId\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Ctx.Provider, {\n        value: value,\n        children: children\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\lib\\\\auth.tsx\",\n        lineNumber: 65,\n        columnNumber: 10\n    }, this);\n}\nfunction useAuth() {\n    const v = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(Ctx);\n    if (!v) throw new Error(\"useAuth must be used inside <AuthProvider>\");\n    return v;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9saWIvYXV0aC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQTJGO0FBQ25EO0FBV3hDLE1BQU1NLG9CQUFNTixvREFBYUEsQ0FBaUI7QUFFbkMsU0FBU08sYUFBYSxFQUFFQyxRQUFRLEVBQTJCO0lBQ2hFLE1BQU1DLFNBQVNKLHNEQUFTQTtJQUN4QixNQUFNLENBQUNLLE9BQU9DLGNBQWMsR0FBR1AsK0NBQVFBLENBQWdCO0lBQ3ZELE1BQU0sQ0FBQ1EsUUFBUUMsVUFBVSxHQUFHVCwrQ0FBUUEsQ0FBZ0I7SUFDcEQsTUFBTVUsU0FBUyxDQUFDLENBQUNKO0lBRWpCUixnREFBU0EsQ0FBQztRQUNSLE1BQU1hLElBQUksTUFBNkIsR0FBR0MsQ0FBNkIsR0FBRztRQUMxRSxNQUFNRSxNQUFNLE1BQTZCLEdBQUdGLENBQThCLEdBQUc7UUFDN0VMLGNBQWNJO1FBQ2RGLFVBQVVLO1FBQ1YsTUFBTUMsWUFBWSxDQUFDQztZQUNqQixJQUFJQSxFQUFFQyxHQUFHLEtBQUssV0FBV0QsRUFBRUMsR0FBRyxLQUFLLFVBQVU7Z0JBQzNDLE1BQU1DLEtBQUtOLGFBQWFDLE9BQU8sQ0FBQztnQkFDaEMsTUFBTU0sT0FBT1AsYUFBYUMsT0FBTyxDQUFDO2dCQUNsQ04sY0FBY1c7Z0JBQ2RULFVBQVVVO1lBQ1o7UUFDRjtRQUNBQyxPQUFPQyxnQkFBZ0IsQ0FBQyxXQUFXTjtRQUNuQyxPQUFPLElBQU1LLE9BQU9FLG1CQUFtQixDQUFDLFdBQVdQO0lBQ3JELEdBQUcsRUFBRTtJQUVMLE1BQU1RLFdBQVcsQ0FBQ1osR0FBa0JHO1FBQ2xDUCxjQUFjSTtRQUNkLElBQUlBLEdBQUdDLGFBQWFZLE9BQU8sQ0FBQyxTQUFTYjthQUFTQyxhQUFhYSxVQUFVLENBQUM7UUFDdEUsSUFBSVgsUUFBUVksV0FBVztZQUNyQmpCLFVBQVVLO1lBQ1YsSUFBSUEsS0FBS0YsYUFBYVksT0FBTyxDQUFDLFVBQVVWO2lCQUFXRixhQUFhYSxVQUFVLENBQUM7UUFDN0U7SUFDRjtJQUVBLE1BQU1FLFNBQVMsQ0FBQ2hCLEdBQVdHO1FBQWtCUyxTQUFTWixHQUFHRztJQUFNO0lBRS9ELE1BQU1jLFVBQVU7UUFDZEwsU0FBUyxNQUFNO1FBQ2Ysd0NBQXdDO1FBQ3ZDLHdDQUF3QztRQUN6Q0gsT0FBT1MsUUFBUSxDQUFDQyxJQUFJLEdBQUcsS0FBSyxzQkFBc0I7UUFDbEQsSUFBSXpCLE9BQU8wQixRQUFRLENBQUNDLFVBQVUsQ0FBQyxpQkFBaUIzQixPQUFPMEIsUUFBUSxLQUFLLFdBQVc7WUFDN0UxQixPQUFPNEIsT0FBTyxDQUFDO1FBQ2pCLE9BQU87WUFDTDVCLE9BQU80QixPQUFPLENBQUM1QixPQUFPMEIsUUFBUTtRQUNoQztJQUNGO0lBRUEsTUFBTUcsUUFBUW5DLDhDQUFPQSxDQUFVLElBQU87WUFDcENXO1lBQVFKO1lBQU9FO1lBQVFlO1lBQVVJO1lBQVFDO1FBQzNDLElBQUk7UUFBQ2xCO1FBQVFKO1FBQU9FO0tBQU87SUFFM0IscUJBQU8sOERBQUNOLElBQUlpQyxRQUFRO1FBQUNELE9BQU9BO2tCQUFROUI7Ozs7OztBQUN0QztBQUVPLFNBQVNnQztJQUNkLE1BQU1DLElBQUl4QyxpREFBVUEsQ0FBQ0s7SUFDckIsSUFBSSxDQUFDbUMsR0FBRyxNQUFNLElBQUlDLE1BQU07SUFDeEIsT0FBT0Q7QUFDVCIsInNvdXJjZXMiOlsid2VicGFjazovL2IyYi1sZWFkZ2VuLWZyb250ZW5kLy4vbGliL2F1dGgudHN4P2Y1NGUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VTdGF0ZSwgUmVhY3ROb2RlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyB1c2VSb3V0ZXIgfSBmcm9tIFwibmV4dC9yb3V0ZXJcIjtcblxudHlwZSBBdXRoQ3R4ID0ge1xuICBhdXRoZWQ6IGJvb2xlYW47XG4gIHRva2VuOiBzdHJpbmcgfCBudWxsO1xuICB1c2VySWQ6IHN0cmluZyB8IG51bGw7XG4gIHNldFRva2VuOiAodDogc3RyaW5nIHwgbnVsbCwgdWlkPzogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcbiAgc2lnbkluOiAodDogc3RyaW5nLCB1aWQ6IHN0cmluZykgPT4gdm9pZDtcbiAgc2lnbk91dDogKCkgPT4gdm9pZDtcbn07XG5cbmNvbnN0IEN0eCA9IGNyZWF0ZUNvbnRleHQ8QXV0aEN0eCB8IG51bGw+KG51bGwpO1xuXG5leHBvcnQgZnVuY3Rpb24gQXV0aFByb3ZpZGVyKHsgY2hpbGRyZW4gfTogeyBjaGlsZHJlbjogUmVhY3ROb2RlIH0pIHtcbiAgY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKCk7XG4gIGNvbnN0IFt0b2tlbiwgc2V0VG9rZW5TdGF0ZV0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW3VzZXJJZCwgc2V0VXNlcklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBhdXRoZWQgPSAhIXRva2VuO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgdCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRva2VuXCIpIDogbnVsbDtcbiAgICBjb25zdCB1aWQgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ1c2VySWRcIikgOiBudWxsO1xuICAgIHNldFRva2VuU3RhdGUodCk7XG4gICAgc2V0VXNlcklkKHVpZCk7XG4gICAgY29uc3Qgb25TdG9yYWdlID0gKGU6IFN0b3JhZ2VFdmVudCkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcInRva2VuXCIgfHwgZS5rZXkgPT09IFwidXNlcklkXCIpIHtcbiAgICAgICAgY29uc3QgbnQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRva2VuXCIpO1xuICAgICAgICBjb25zdCBudWlkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ1c2VySWRcIik7XG4gICAgICAgIHNldFRva2VuU3RhdGUobnQpO1xuICAgICAgICBzZXRVc2VySWQobnVpZCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInN0b3JhZ2VcIiwgb25TdG9yYWdlKTtcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzdG9yYWdlXCIsIG9uU3RvcmFnZSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBzZXRUb2tlbiA9ICh0OiBzdHJpbmcgfCBudWxsLCB1aWQ/OiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgc2V0VG9rZW5TdGF0ZSh0KTtcbiAgICBpZiAodCkgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ0b2tlblwiLCB0KTsgZWxzZSBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcInRva2VuXCIpO1xuICAgIGlmICh1aWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2V0VXNlcklkKHVpZCk7XG4gICAgICBpZiAodWlkKSBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInVzZXJJZFwiLCB1aWQpOyBlbHNlIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKFwidXNlcklkXCIpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBzaWduSW4gPSAodDogc3RyaW5nLCB1aWQ6IHN0cmluZykgPT4geyBzZXRUb2tlbih0LCB1aWQpOyB9O1xuXG4gIGNvbnN0IHNpZ25PdXQgPSAoKSA9PiB7XG4gICAgc2V0VG9rZW4obnVsbCwgbnVsbCk7XG4gICAgLy8gcmVkaXJlY3QgdG8gc2lnbmluIGZyb20gcHJpdmF0ZSBhcmVhc1xuICAgICAvLyBhbHdheXMgc2VuZCB1c2VyIHRvIEhvbWUgYWZ0ZXIgbG9nb3V0XG4gICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi9cIjsgLy8g8J+RiCByZWRpcmVjdCB0byBIb21lXG4gICAgaWYgKHJvdXRlci5wYXRobmFtZS5zdGFydHNXaXRoKFwiL2Rhc2hib2FyZFwiKSB8fCByb3V0ZXIucGF0aG5hbWUgPT09IFwiL2FnZW50c1wiKSB7XG4gICAgICByb3V0ZXIucmVwbGFjZShcIi9hdXRoL3NpZ25pblwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcm91dGVyLnJlcGxhY2Uocm91dGVyLnBhdGhuYW1lKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmFsdWUgPSB1c2VNZW1vPEF1dGhDdHg+KCgpID0+ICh7XG4gICAgYXV0aGVkLCB0b2tlbiwgdXNlcklkLCBzZXRUb2tlbiwgc2lnbkluLCBzaWduT3V0XG4gIH0pLCBbYXV0aGVkLCB0b2tlbiwgdXNlcklkXSk7XG5cbiAgcmV0dXJuIDxDdHguUHJvdmlkZXIgdmFsdWU9e3ZhbHVlfT57Y2hpbGRyZW59PC9DdHguUHJvdmlkZXI+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlQXV0aCgpIHtcbiAgY29uc3QgdiA9IHVzZUNvbnRleHQoQ3R4KTtcbiAgaWYgKCF2KSB0aHJvdyBuZXcgRXJyb3IoXCJ1c2VBdXRoIG11c3QgYmUgdXNlZCBpbnNpZGUgPEF1dGhQcm92aWRlcj5cIik7XG4gIHJldHVybiB2O1xufVxuIl0sIm5hbWVzIjpbImNyZWF0ZUNvbnRleHQiLCJ1c2VDb250ZXh0IiwidXNlRWZmZWN0IiwidXNlTWVtbyIsInVzZVN0YXRlIiwidXNlUm91dGVyIiwiQ3R4IiwiQXV0aFByb3ZpZGVyIiwiY2hpbGRyZW4iLCJyb3V0ZXIiLCJ0b2tlbiIsInNldFRva2VuU3RhdGUiLCJ1c2VySWQiLCJzZXRVc2VySWQiLCJhdXRoZWQiLCJ0IiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInVpZCIsIm9uU3RvcmFnZSIsImUiLCJrZXkiLCJudCIsIm51aWQiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsInNldFRva2VuIiwic2V0SXRlbSIsInJlbW92ZUl0ZW0iLCJ1bmRlZmluZWQiLCJzaWduSW4iLCJzaWduT3V0IiwibG9jYXRpb24iLCJocmVmIiwicGF0aG5hbWUiLCJzdGFydHNXaXRoIiwicmVwbGFjZSIsInZhbHVlIiwiUHJvdmlkZXIiLCJ1c2VBdXRoIiwidiIsIkVycm9yIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./lib/auth.tsx\n");

/***/ }),

/***/ "./pages/_app.tsx":
/*!************************!*\
  !*** ./pages/_app.tsx ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ MyApp)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../lib/auth */ \"./lib/auth.tsx\");\n/* harmony import */ var _components_Header__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/Header */ \"./components/Header.tsx\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_3__);\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_lib_auth__WEBPACK_IMPORTED_MODULE_1__.AuthProvider, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_Header__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {}, void 0, false, {\n                fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\pages\\\\_app.tsx\",\n                lineNumber: 9,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\pages\\\\_app.tsx\",\n                lineNumber: 10,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\Lenovo\\\\b2b-leadgen-ai\\\\frontend\\\\pages\\\\_app.tsx\",\n        lineNumber: 8,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUMyQztBQUNEO0FBQ1g7QUFFaEIsU0FBU0UsTUFBTSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBWTtJQUM5RCxxQkFDRSw4REFBQ0osbURBQVlBOzswQkFDWCw4REFBQ0MsMERBQU1BOzs7OzswQkFDUCw4REFBQ0U7Z0JBQVcsR0FBR0MsU0FBUzs7Ozs7Ozs7Ozs7O0FBRzlCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYjJiLWxlYWRnZW4tZnJvbnRlbmQvLi9wYWdlcy9fYXBwLnRzeD8yZmJlIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tIFwibmV4dC9hcHBcIjtcbmltcG9ydCB7IEF1dGhQcm92aWRlciB9IGZyb20gXCIuLi9saWIvYXV0aFwiO1xuaW1wb3J0IEhlYWRlciBmcm9tIFwiLi4vY29tcG9uZW50cy9IZWFkZXJcIjtcbmltcG9ydCBcIi4uL3N0eWxlcy9nbG9iYWxzLmNzc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBNeUFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPEF1dGhQcm92aWRlcj5cbiAgICAgIDxIZWFkZXIgLz5cbiAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICA8L0F1dGhQcm92aWRlcj5cbiAgKTtcbn1cbiJdLCJuYW1lcyI6WyJBdXRoUHJvdmlkZXIiLCJIZWFkZXIiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./pages/_app.tsx\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./pages/_app.tsx")));
module.exports = __webpack_exports__;

})();