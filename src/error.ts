export class AbortError extends Error {
  code = "ABORT_ERR";
  static is(err: any): err is AbortError {
    return err instanceof AbortError || err.code === "ABORT_ERR";
  }
}
