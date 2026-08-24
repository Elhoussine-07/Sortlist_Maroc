globalThis.__nitro_main__ = import.meta.url;
import { n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-08-18T17:09:17.676Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/ActionModal-DrsPc4R4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"408-HH+jlDzL+CpSPYStWpNFjpj9+Iw\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 1032,
		"path": "../public/assets/ActionModal-DrsPc4R4.js"
	},
	"/assets/DashboardShell-BIEt1nGI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b11-m4MdMd58q391s9sVyNVnbWE3b20\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 35601,
		"path": "../public/assets/DashboardShell-BIEt1nGI.js"
	},
	"/assets/Blocks-DeGIXsoA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"114e-K2+2Wuh5OqEN471VEv7d7F266xM\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 4430,
		"path": "../public/assets/Blocks-DeGIXsoA.js"
	},
	"/assets/DataTable-Clc55Ktr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"504-X7myo4Smlj2X7W88uc/Zn06bliY\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 1284,
		"path": "../public/assets/DataTable-Clc55Ktr.js"
	},
	"/assets/EmptyState-qCDtlEyQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1db4-sP9DjqBLAQdbdZvWTbua09zFfUU\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 7604,
		"path": "../public/assets/EmptyState-qCDtlEyQ.js"
	},
	"/assets/Footer-DoNMWqxF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"25df-METgLEwT+ZnrrtUKIVhALih99+A\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 9695,
		"path": "../public/assets/Footer-DoNMWqxF.js"
	},
	"/assets/ListControls-Bmat0Acu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b09-yoo3SkvdxRNLNRNbj0yLymLvpaI\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 2825,
		"path": "../public/assets/ListControls-Bmat0Acu.js"
	},
	"/assets/MarketingHeader-DCOUedch.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1641-irTxS/Ps2MJTkM+1fO4nMoUgRu0\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 5697,
		"path": "../public/assets/MarketingHeader-DCOUedch.js"
	},
	"/assets/Match-D_yk-7BJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bdd8-dNpcQAWyrl3lzZJvDcKS6tNaHp0\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 48600,
		"path": "../public/assets/Match-D_yk-7BJ.js"
	},
	"/assets/Skeletons-CDjy9D1d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d1-P3uAX6SSAcjGlRzxp41PaTiU5yU\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 2001,
		"path": "../public/assets/Skeletons-CDjy9D1d.js"
	},
	"/assets/a-propos-Dvi1wygN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"191a-c2i6Kh2UDYHBJuofPcQymeyfjTM\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 6426,
		"path": "../public/assets/a-propos-Dvi1wygN.js"
	},
	"/assets/SmartBriefing-OOj2sWRn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"68c9-LS0yIOItDNJGFHUKGq3XNo7hdf8\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 26825,
		"path": "../public/assets/SmartBriefing-OOj2sWRn.js"
	},
	"/assets/admin.avis-C5VIARqX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b0a-UCO+M2G7seUbQYkuj9yofVXNTFU\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 6922,
		"path": "../public/assets/admin.avis-C5VIARqX.js"
	},
	"/assets/admin.litiges-C20cimBc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"276f-z9YMxm/kTfxTL6tflueiD+A3jQY\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 10095,
		"path": "../public/assets/admin.litiges-C20cimBc.js"
	},
	"/assets/admin.notifications-C2U0pC0V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1599-ipVK0AOP25OoieevK0Oba0yFKdI\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 5529,
		"path": "../public/assets/admin.notifications-C2U0pC0V.js"
	},
	"/assets/admin.tableau-de-bord-BA-cV-D-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"beb-J7p5dkkxAMZLroapNAkbCyE7SIo\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 3051,
		"path": "../public/assets/admin.tableau-de-bord-BA-cV-D-.js"
	},
	"/assets/agence.facturation-BIwCrjt1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30e0-rFO8N3ZojZfrPBZs/+X0zwng5uQ\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 12512,
		"path": "../public/assets/agence.facturation-BIwCrjt1.js"
	},
	"/assets/agence.mes-prospections-D4bCrfQN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f2e-PTJmyFazzjjS/GyKdU29UT5vCis\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 3886,
		"path": "../public/assets/agence.mes-prospections-D4bCrfQN.js"
	},
	"/assets/agence.invitations-CJC2PcZY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12a4-ukhjOE+n7pOPrTKgZCeS/DxPLCs\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 4772,
		"path": "../public/assets/agence.invitations-CJC2PcZY.js"
	},
	"/assets/agence.analytics-ndgbAebr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26be-cPMEPXcDrvmjiMTtPgcD72w1asM\"",
		"mtime": "2026-08-18T17:09:13.054Z",
		"size": 9918,
		"path": "../public/assets/agence.analytics-ndgbAebr.js"
	},
	"/assets/agence.notifications-DZYV7YyN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15a6-0dERs3383283f55gXpwQSU0rNi4\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 5542,
		"path": "../public/assets/agence.notifications-DZYV7YyN.js"
	},
	"/assets/agence.opportunites-BvJ27AFk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b24-frISA6milT6DVq1G+6XZKVnPKxU\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 15140,
		"path": "../public/assets/agence.opportunites-BvJ27AFk.js"
	},
	"/assets/agence.parametres-BsqPOdmj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3506-TReeZxb+y9Zpl0L8QZjp3GQiNWY\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 13574,
		"path": "../public/assets/agence.parametres-BsqPOdmj.js"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-08-18T17:09:17.676Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/agence.profil-BZDYJyol.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ca7-/t1JS4hdj8YhR53aSALM+2sczbg\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 19623,
		"path": "../public/assets/agence.profil-BZDYJyol.js"
	},
	"/assets/agence.projets-en-cours-CxB2ADUI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b5c-68mmeifINmkAf4b9K4T5110CoY8\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 7004,
		"path": "../public/assets/agence.projets-en-cours-CxB2ADUI.js"
	},
	"/assets/agence.prospection-CljAzs2u.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2449-7pFb/64g49zDAzGpCxuYxtAVUOo\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 9289,
		"path": "../public/assets/agence.prospection-CljAzs2u.js"
	},
	"/assets/agence.suspension-Cq8ee5WL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27f5-gvN7cLbDDExs3kVEEyk8IzjfQcM\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 10229,
		"path": "../public/assets/agence.suspension-Cq8ee5WL.js"
	},
	"/assets/agence.tableau-de-bord-BnHIiEgD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"212a-xB6WbIbocBiDhuS1dWq9+lq30f4\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 8490,
		"path": "../public/assets/agence.tableau-de-bord-BnHIiEgD.js"
	},
	"/assets/agence.workflow-D6LjRj6V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"138d-cVKd1pAft6Y/dIkdlatcXero2Mk\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 5005,
		"path": "../public/assets/agence.workflow-D6LjRj6V.js"
	},
	"/assets/agences-Ch9dBfCX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2f27-sq4Pd4tu+VVbeXerQhaSAElHprc\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 12071,
		"path": "../public/assets/agences-Ch9dBfCX.js"
	},
	"/assets/agences_._id-CSryMunq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5085-IztxRxfJK/YquO0uQCV4RbxY6NI\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 20613,
		"path": "../public/assets/agences_._id-CSryMunq.js"
	},
	"/assets/arrow-left-VBm_066j.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a-fAO5mAJC5T3vjxUUDb7/91v6Weg\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 154,
		"path": "../public/assets/arrow-left-VBm_066j.js"
	},
	"/assets/agency-projects.service-C9qgo9Eo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c54-3TxetLlXs+sbe/Sikw4jyZIbKZk\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 3156,
		"path": "../public/assets/agency-projects.service-C9qgo9Eo.js"
	},
	"/assets/aide-C5IAmV8J.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7cf-azoKSbjdjq7ke6pxZYhzWCJKY+M\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 1999,
		"path": "../public/assets/aide-C5IAmV8J.js"
	},
	"/assets/arrow-right-CznRYw3-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a-nLDa57NLoCvDs0+BNmzpJxjNNBE\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 154,
		"path": "../public/assets/arrow-right-CznRYw3-.js"
	},
	"/assets/arrow-up-right-DFGJNjAD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"110-4RCdn5cv6tl7G6LEeoGX4fG/2gE\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 272,
		"path": "../public/assets/arrow-up-right-DFGJNjAD.js"
	},
	"/assets/auth.service-DPDRQLl5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9cd-VNM0z+q8hDvAlbZgsOLYPVxdckY\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 2509,
		"path": "../public/assets/auth.service-DPDRQLl5.js"
	},
	"/assets/auth.store-B7fBPcPF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1dc-40dEMijdG+6r/6nyWPGWj9JkzK0\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 476,
		"path": "../public/assets/auth.store-B7fBPcPF.js"
	},
	"/assets/badge-check-BOJWJoOK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"131-1D5oUrUv4dW0yFAIibqH6GwUGKg\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 305,
		"path": "../public/assets/badge-check-BOJWJoOK.js"
	},
	"/assets/blog-8Omsk53d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6b2-zHLBQcI7GscsQTlVXmWH9NmQ81M\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 1714,
		"path": "../public/assets/blog-8Omsk53d.js"
	},
	"/assets/briefcase-BX8-C16e.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d1-svhbHUKFQwtO64BhnOA25oxfl0U\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 209,
		"path": "../public/assets/briefcase-BX8-C16e.js"
	},
	"/assets/briefing.store-mDxWIGJR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3d5-vO0I9i+MtKjtGxFhmdpWY/DlQfs\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 981,
		"path": "../public/assets/briefing.store-mDxWIGJR.js"
	},
	"/assets/building-2-CJ78Woit.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"174-Bqa1aQQbQZrC7oMeg8zfMOAdgO4\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 372,
		"path": "../public/assets/building-2-CJ78Woit.js"
	},
	"/assets/calendar-DGlaoEHn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f6-MUfLaWh7s9SJbLKM04efpeglV3A\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 246,
		"path": "../public/assets/calendar-DGlaoEHn.js"
	},
	"/assets/calendar-days-CmlBDC93.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e3-t4MHKarRFWwRLElYCE81Gju4K50\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 483,
		"path": "../public/assets/calendar-days-CmlBDC93.js"
	},
	"/assets/carrieres-jiGhzLH3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6b8-CkiHT4UqgptecpLOvhAoWpofjDM\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 1720,
		"path": "../public/assets/carrieres-jiGhzLH3.js"
	},
	"/assets/check-check-CBiBbBF3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a8-/4uSz40dVzzZ9G2HDbll3vO8LYU\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 168,
		"path": "../public/assets/check-check-CBiBbBF3.js"
	},
	"/assets/chevron-down-C03f1-MB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"75-ITgoCP+JLi4FJLFGA088i+7ElRY\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 117,
		"path": "../public/assets/chevron-down-C03f1-MB.js"
	},
	"/assets/chevron-left-BBkqy6RP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"77-AfkktCiTfgu6ADVS+nCzGJ5Rbzw\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 119,
		"path": "../public/assets/chevron-left-BBkqy6RP.js"
	},
	"/assets/chevron-right-Co-TfzHn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"be-j+HrHdm/v/gZ1Q/qXztHNHiThkk\"",
		"mtime": "2026-08-18T17:09:13.055Z",
		"size": 190,
		"path": "../public/assets/chevron-right-Co-TfzHn.js"
	},
	"/assets/circle-check-Dh1-ZbTG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a7-5hV5jvcbIZSGJoCR3TQjwK8nheg\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 167,
		"path": "../public/assets/circle-check-Dh1-ZbTG.js"
	},
	"/assets/circle-user-round-Buc2VbdF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e4-pTYKASG/yNBuledqpM64ldqcqVk\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 228,
		"path": "../public/assets/circle-user-round-Buc2VbdF.js"
	},
	"/assets/circle-x-CdX3zLe7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c4-EmtrosfVugHpdZn3+BQNLtcxKQQ\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 196,
		"path": "../public/assets/circle-x-CdX3zLe7.js"
	},
	"/assets/client.agences-favorites-CIv0JCS6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"afb-rowJk/ixJNlRRDcPdyBGLQRZK/o\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 2811,
		"path": "../public/assets/client.agences-favorites-CIv0JCS6.js"
	},
	"/assets/client.collaborations-CWB85v19.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2244-/VWrJK4xkZw9I2yRTT7o7JAvoH8\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 8772,
		"path": "../public/assets/client.collaborations-CWB85v19.js"
	},
	"/assets/client.mes-projets-IRngrGQs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3491-1tPMgT7QxYK/lvPXeKhD3nsF094\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 13457,
		"path": "../public/assets/client.mes-projets-IRngrGQs.js"
	},
	"/assets/client.mes-projets_._id-CYE0B8Vt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4fdd-zHXg/v1DwLDaUUX2nFAOd4Ge4eE\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 20445,
		"path": "../public/assets/client.mes-projets_._id-CYE0B8Vt.js"
	},
	"/assets/client.mon-profil-CZtYTIit.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2563-h7O/vIYmSOFIyQRaIPXh9MxUn0o\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 9571,
		"path": "../public/assets/client.mon-profil-CZtYTIit.js"
	},
	"/assets/client.notifications-DtQYDek_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e06-pWZtHY8yIf0TY6gyS0YactafT7M\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 7686,
		"path": "../public/assets/client.notifications-DtQYDek_.js"
	},
	"/assets/client.parametres-U3Jis1Kn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2b72-zqFMau0Laeyf9oYFU98B9lR4fYw\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 11122,
		"path": "../public/assets/client.parametres-U3Jis1Kn.js"
	},
	"/assets/client.postuler-un-projet-BhYmtFHF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ec-GVD6VtYZsJSRIgyxHxw1pA6IQCg\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 236,
		"path": "../public/assets/client.postuler-un-projet-BhYmtFHF.js"
	},
	"/assets/client.tableau-de-bord-BkoBFt4V.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"35d7-7mqV3FZ2r6h0NHQls+73II3tscI\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 13783,
		"path": "../public/assets/client.tableau-de-bord-BkoBFt4V.js"
	},
	"/assets/clock-ClZVlJSz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9e-aQj8eQguVEjcSWvxGZUxhp/AV+g\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 158,
		"path": "../public/assets/clock-ClZVlJSz.js"
	},
	"/assets/comment-ca-marche-CUXZcaiR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3ed3-gIiI50m2nCb6ZSPEKX4aw/ZN2VM\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 16083,
		"path": "../public/assets/comment-ca-marche-CUXZcaiR.js"
	},
	"/assets/compass-BCsPMKI3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f0-sZkK1/pS4WNyDDp1E2aPGz1sQ/w\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 240,
		"path": "../public/assets/compass-BCsPMKI3.js"
	},
	"/assets/connexion-Cw4AhwBV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"21ec-taYVcha8BHeyP2Dkk6dISDX80F4\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 8684,
		"path": "../public/assets/connexion-Cw4AhwBV.js"
	},
	"/assets/credit-card-COOgni1h.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c4-W591/aGEk3dGwwwXkgksYIR9fuA\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 196,
		"path": "../public/assets/credit-card-COOgni1h.js"
	},
	"/assets/devenir-partenaire-AnxiF4aD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6ed-bT5j/mD3DsiPSsfg21n8QofZ5vQ\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 1773,
		"path": "../public/assets/devenir-partenaire-AnxiF4aD.js"
	},
	"/assets/dialog-BfyqOkUM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18a8-5Mw029zVqvNFOuEszmHnIAHpH8U\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 6312,
		"path": "../public/assets/dialog-BfyqOkUM.js"
	},
	"/assets/disputes.service-BHSO6MRr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3b8-MIkZ6UfMGrR0CQX5hkFT6QKqS8A\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 952,
		"path": "../public/assets/disputes.service-BHSO6MRr.js"
	},
	"/assets/download-DhuNfdz5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"dd-S5x7DMmbkgBujSNAyU0l6wzs1z8\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 221,
		"path": "../public/assets/download-DhuNfdz5.js"
	},
	"/assets/dropdown-menu-BnwZi4N-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e0e9-J5GADdwOt1Wo8fGtwUZkc45eqnE\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 57577,
		"path": "../public/assets/dropdown-menu-BnwZi4N-.js"
	},
	"/assets/ellipsis-vertical-C__mh1pC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e0-qUlISGBC4N63tNKUn8ZP2aUNpgM\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 224,
		"path": "../public/assets/ellipsis-vertical-C__mh1pC.js"
	},
	"/assets/es2015-ipJ8N4B0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"81d9-fycjR5NI6SIhm/tdtzYoFTRnA7I\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 33241,
		"path": "../public/assets/es2015-ipJ8N4B0.js"
	},
	"/assets/etudes-kv1DDZta.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"84c-SoqLvvgj7NC6kFIrd4KAvisBZZs\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 2124,
		"path": "../public/assets/etudes-kv1DDZta.js"
	},
	"/assets/eye-BKxBFwE1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f5-MD94TM9iPzjZbhEesJ/C6ICYcIE\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 245,
		"path": "../public/assets/eye-BKxBFwE1.js"
	},
	"/assets/file-text-DYYi9F6d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"176-7u6E8460pN6hSgKlNFGlnsD2Luc\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 374,
		"path": "../public/assets/file-text-DYYi9F6d.js"
	},
	"/assets/fonctionnalites._slug-DV7SpzMa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"167e-bGs5wdUXGKVMvrDQTSsn8/d+09c\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 5758,
		"path": "../public/assets/fonctionnalites._slug-DV7SpzMa.js"
	},
	"/assets/globe-Dk0F0nQg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e7-uLUUHZ4MwkiB4CcUpPiZxFT5H38\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 231,
		"path": "../public/assets/globe-Dk0F0nQg.js"
	},
	"/assets/handshake-TqkJHXQN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b3-xIokIvoMzarwSfmL1FvM7PwIgh0\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 435,
		"path": "../public/assets/handshake-TqkJHXQN.js"
	},
	"/assets/guides-BQPeI1eP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7a2-T936fibCzu1R5WxayDufGoEaIYc\"",
		"mtime": "2026-08-18T17:09:13.056Z",
		"size": 1954,
		"path": "../public/assets/guides-BQPeI1eP.js"
	},
	"/assets/http-CHaGOnu2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9fd-ancFN1ig+3oNSkgS6qneFMKcwwY\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 2557,
		"path": "../public/assets/http-CHaGOnu2.js"
	},
	"/assets/image-DAs0fkAL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"102-p42VMadCKpIulDTCxe7qTH0TLZE\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 258,
		"path": "../public/assets/image-DAs0fkAL.js"
	},
	"/assets/index-B3XwmCKH.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5f794-T0BIdqVKXKtsKJCjT8IyIQfHpz8\"",
		"mtime": "2026-08-18T17:09:13.053Z",
		"size": 391060,
		"path": "../public/assets/index-B3XwmCKH.js"
	},
	"/assets/inscription-agence-D8cP-Ssg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"27be-Dabl6ILfjCMNRc1EZoc7LKhzxWo\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 10174,
		"path": "../public/assets/inscription-agence-D8cP-Ssg.js"
	},
	"/assets/life-buoy-DMjiflAv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"172-BZPFtvWlERgScr8cdW13IFrW59E\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 370,
		"path": "../public/assets/life-buoy-DMjiflAv.js"
	},
	"/assets/link-DHxYweN4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e6f-PtoerC5chMSt8YHHvWsrSpDLcXo\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 7791,
		"path": "../public/assets/link-DHxYweN4.js"
	},
	"/assets/inscription-client-Btr2ZxMQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14b5-fzn4D6MmOm65jCOH2cgUztMK4Fk\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 5301,
		"path": "../public/assets/inscription-client-Btr2ZxMQ.js"
	},
	"/assets/loader-circle-QCx5GhaO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1aa-1QqyZBE4LEJP4qeQcLGQSUWh5Z8\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 426,
		"path": "../public/assets/loader-circle-QCx5GhaO.js"
	},
	"/assets/lock-BpHyiPxa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c3-NL3uw+MjM8w1yRvb/aHKzd2mJzg\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 195,
		"path": "../public/assets/lock-BpHyiPxa.js"
	},
	"/assets/mail-DBoQXyc2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ca-CfPj/Z09n00Xbnq0bU671fzyLQ0\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 202,
		"path": "../public/assets/mail-DBoQXyc2.js"
	},
	"/assets/map-pin-CkKlrbsI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f8-0IJlWdfyrU/dHGdGewm+h7s384M\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 248,
		"path": "../public/assets/map-pin-CkKlrbsI.js"
	},
	"/assets/matchContext-qzYKvnGY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8d-7q4j4xc1TYswwPy4i2LTy8faeAw\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 141,
		"path": "../public/assets/matchContext-qzYKvnGY.js"
	},
	"/assets/middleware-nsF33x1I.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"757a-cXbmatWCKO2haKvf8uWoP690m8E\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 30074,
		"path": "../public/assets/middleware-nsF33x1I.js"
	},
	"/assets/newspaper-D6rkQUH3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14d-nva2JGYuJ7iGCm9IOHEZLwhW2WQ\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 333,
		"path": "../public/assets/newspaper-D6rkQUH3.js"
	},
	"/assets/moderation.service-DfbxNDoZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a53-mLYk12uGknKkletncVYtyfyorec\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 2643,
		"path": "../public/assets/moderation.service-DfbxNDoZ.js"
	},
	"/assets/opportunities.service-ijAw29QC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101e-+3gMVJiBlkSRGGwhIu1YYeDhZjU\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 4126,
		"path": "../public/assets/opportunities.service-ijAw29QC.js"
	},
	"/assets/palette-h17o45Tx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f3-UhsZkcYapCCjnJtNxSPIp2Fw7LA\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 499,
		"path": "../public/assets/palette-h17o45Tx.js"
	},
	"/assets/postuler-un-projet-DC3g6G3x.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f1-Nx/bgvJ2I7o2Xq+uKVd20rEti9M\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 241,
		"path": "../public/assets/postuler-un-projet-DC3g6G3x.js"
	},
	"/assets/profile.service-C8rabRky.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a1d-Wn4bqogi/N3g+Dw7SXrhLy4FKH4\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 6685,
		"path": "../public/assets/profile.service-C8rabRky.js"
	},
	"/assets/presse-DVT0hD3U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6c6-g/LBtnCrcEkPh3z95acX8O4Vdms\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 1734,
		"path": "../public/assets/presse-DVT0hD3U.js"
	},
	"/assets/projects.service-CXbODs7f.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e98-thgKOeyPwWR/Hq/su2bKrTKfLe0\"",
		"mtime": "2026-08-18T17:09:13.057Z",
		"size": 3736,
		"path": "../public/assets/projects.service-CXbODs7f.js"
	},
	"/assets/projets-x96GeZPh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2158-u6Q0Q4BAe8TbQycqjoem2oK9LM4\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 8536,
		"path": "../public/assets/projets-x96GeZPh.js"
	},
	"/assets/prospection.service-CofcQLtd.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b98-JWWUX9woKzDLXTsbhBcsljODfXE\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 2968,
		"path": "../public/assets/prospection.service-CofcQLtd.js"
	},
	"/assets/redirect-1Dss4sOM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"216-AhfiXwQqYdLrM+uQAOtPHfIddmI\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 534,
		"path": "../public/assets/redirect-1Dss4sOM.js"
	},
	"/assets/refresh-ccw-xdooFzVO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"136-WLQbkGk7kyaZERAN6ftmJj39WU0\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 310,
		"path": "../public/assets/refresh-ccw-xdooFzVO.js"
	},
	"/assets/ressources-LzN30gM6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"80a-UgWY+z37m0iVkDtyEteIRpeFlxA\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 2058,
		"path": "../public/assets/ressources-LzN30gM6.js"
	},
	"/assets/route-DDXtJoVy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"25d-Ueg/VTUCDrks9JUZ3pRpyiUYKdA\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 605,
		"path": "../public/assets/route-DDXtJoVy.js"
	},
	"/assets/routes-BEOBJ76Z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"790c-ZnqyBib6TevqWS2kQcX50fI0m5A\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 30988,
		"path": "../public/assets/routes-BEOBJ76Z.js"
	},
	"/assets/scale-DGWWAAY2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2f7-NxNfVHiTXn+pbFke6pfgssiXowc\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 759,
		"path": "../public/assets/scale-DGWWAAY2.js"
	},
	"/assets/search-C6Yo2KRW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a3-WMokI0ydWzhgOvhxcYZOqRUync8\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 163,
		"path": "../public/assets/search-C6Yo2KRW.js"
	},
	"/assets/send--n6-VQNk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"117-Xa/EzEatOfc1eCSWVIjvo6c+pdA\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 279,
		"path": "../public/assets/send--n6-VQNk.js"
	},
	"/assets/services-BBJId9sb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e8f-neddJF7dcAVfOvoE9fy8cDfKSlg\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 3727,
		"path": "../public/assets/services-BBJId9sb.js"
	},
	"/assets/shield-check-BKwnwT1H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"135-Wv4O693M9Tyozh3uDn6x5jIY078\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 309,
		"path": "../public/assets/shield-check-BKwnwT1H.js"
	},
	"/assets/skeleton-Bv-nD55W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de-CJyyKQzIq2fyEqLVfkD+uER1e0o\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 222,
		"path": "../public/assets/skeleton-Bv-nD55W.js"
	},
	"/assets/sparkles-DRqp5beB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e3-A0YYXyxh7X3i2A/jtPSj5heRCyc\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 483,
		"path": "../public/assets/sparkles-DRqp5beB.js"
	},
	"/assets/star-Bkp0g6SB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cd-1Hj4absXUeI/aB6FPRA3mfmsMOg\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 461,
		"path": "../public/assets/star-Bkp0g6SB.js"
	},
	"/assets/styles-BAa1WPne.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"199df-26BP6oTftRl4pTIseYUc/WNBJCc\"",
		"mtime": "2026-08-18T17:09:13.059Z",
		"size": 104927,
		"path": "../public/assets/styles-BAa1WPne.css"
	},
	"/assets/tabs-DO9PCUgt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20d1-UqBYVJVkKctGidyXwsuIcERB5pw\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 8401,
		"path": "../public/assets/tabs-DO9PCUgt.js"
	},
	"/assets/target-Cgavor-L.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"160-unItsqIc7TZ3mzI1VvejMRQUtfM\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 352,
		"path": "../public/assets/target-Cgavor-L.js"
	},
	"/assets/tarifs-BLTR2ZwQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"932-hwM3qIO1i3hyFBuHr+BWvSZVKno\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 2354,
		"path": "../public/assets/tarifs-BLTR2ZwQ.js"
	},
	"/assets/trash-2-mSSSUY5S.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13d-/6IX3LmKoN5jy/QSxjh+ijrIizY\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 317,
		"path": "../public/assets/trash-2-mSSSUY5S.js"
	},
	"/assets/trending-up-BgsM1WPa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a4-iSOz4r6lvi3EeYVXcXv4MIV4rJg\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 164,
		"path": "../public/assets/trending-up-BgsM1WPa.js"
	},
	"/assets/user-round-DmNI9Taz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ab-vS3UD5Iw8RkWCIJawKcSY+NQedQ\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 171,
		"path": "../public/assets/user-round-DmNI9Taz.js"
	},
	"/assets/users-CsEZaqK2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"127-28e3dge8+PsPI3Esdv8UaiM/u9k\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 295,
		"path": "../public/assets/users-CsEZaqK2.js"
	},
	"/assets/users-round-CnOwNWER.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a6-sWLQ0V79Jx6AT7BpX1Syqxa9zr0\"",
		"mtime": "2026-08-18T17:09:13.058Z",
		"size": 422,
		"path": "../public/assets/users-round-CnOwNWER.js"
	},
	"/assets/utils-BGwYSir2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6f3c-TTK5JwisFliywEKMOJvm+QGz48E\"",
		"mtime": "2026-08-18T17:09:13.059Z",
		"size": 28476,
		"path": "../public/assets/utils-BGwYSir2.js"
	},
	"/assets/wallet-BED11ytx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"113-/1Fo0Xy8qQqrSNP0G4bEdbrwa28\"",
		"mtime": "2026-08-18T17:09:13.059Z",
		"size": 275,
		"path": "../public/assets/wallet-BED11ytx.js"
	},
	"/assets/x-VFNlAxO7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8f-/h3b9oc5PfSbR4tR1H8LYgagj34\"",
		"mtime": "2026-08-18T17:09:13.059Z",
		"size": 143,
		"path": "../public/assets/x-VFNlAxO7.js"
	},
	"/assets/zod-CgN-l1jl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7780-1boO7YJq7NweU64VqGlrpY1xzvo\"",
		"mtime": "2026-08-18T17:09:13.059Z",
		"size": 30592,
		"path": "../public/assets/zod-CgN-l1jl.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_8nSXd9 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_8nSXd9
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
