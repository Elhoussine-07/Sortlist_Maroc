### platform_core

PLateforme B2B

### Installation

This app is normally installed automatically inside the `frappe` container
built by the sibling `microservices_v1` repo (see its root README —
`docker compose up` clones nothing, it `COPY`'s this repo's `platform_core/`
straight into the image and runs `bench get-app` against that local path).

To install it manually against your own bench instead:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch master
bench install-app platform_core
```

Compatibility note: this app targets **Frappe version-15** on **Python
3.10–3.12** (see `pyproject.toml` `requires-python` and
`microservices_v1/infrastructure/frappe/Dockerfile`, which builds the bench
with `--frappe-branch version-15` on `python:3.12-slim`).

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/platform_core
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

mit
