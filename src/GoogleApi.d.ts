// FormApp's documented publish-state overload is newer than the community types.
declare namespace GoogleAppsScript.Forms {
  interface FormApp {
    create(title: string, isPublished: boolean): Form;
  }
}
