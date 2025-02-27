export const SINGLE_CHOICE_KEY = "SINGLE_CHOICE";
export const MULTIPLE_CHOICE_KEY = "MULTIPLE_CHOICE";

export interface Question {
  type: typeof SINGLE_CHOICE_KEY | typeof MULTIPLE_CHOICE_KEY;
  heading: string;
  subtext?: string;
  options: string[];
  answers: string[];
}

export const QUESTIONS_ARRAY: Question[] = [
  // Question 1
  {
    type: SINGLE_CHOICE_KEY,
    heading: "What does the 'SDE' stand for?",
    options: [
      "The Standard Developer Environment",
      "The Secure Data Environment",
      "The Safe Data and Engineering",
    ],
    answers: ["The Secure Data Environment"],
  },
  // Question 2
  {
    type: SINGLE_CHOICE_KEY,
    heading: "Which of the Five Safes does the following quote refer to?",
    subtext:
      '"Data confidentiality is always maintained, and data protection best practice is always followed in relation to any code or results taken out of the environment"',
    options: [
      "Safe data",
      "Safe projects",
      "Safe people",
      "Safe settings",
      "Safe outputs",
    ],
    answers: ["Safe outputs"],
  },
  // Question 3
  {
    type: SINGLE_CHOICE_KEY,
    heading: "Which statement is correct?",
    options: [
      "Users should store files they want to persist in the 'Home Folder'. The 'Collab Storage' drive should be used sparingly and for small files as overuse will increase the load time of the virtual machine for all users. ",
      "Users should store all files in the ‘Collab Storage’ drive",
      "All files persist in the SDE, so users do not need to store them anywhere. ",
    ],
    answers: [
      "Users should store files they want to persist in the 'Home Folder'. The 'Collab Storage' drive should be used sparingly and for small files as overuse will increase the load time of the virtual machine for all users. ",
    ],
  },
  // Question 4
  {
    type: SINGLE_CHOICE_KEY,
    heading:
      "'Version control' is the process of tracking and managing changes to files",
    options: ["True", "False"],
    answers: ["True"],
  },
  // Question 5
  {
    type: SINGLE_CHOICE_KEY,
    heading: "How do most users access data stored in the SDE?",
    options: ["With Databricks", "With Gitlab", "With RStudio"],
    answers: ["With Databricks"],
  },
  // Question 6
  {
    type: SINGLE_CHOICE_KEY,
    heading: "Which of the following is an acceptable type of data to import?",
    options: [
      "A list of names and addresses",
      "Clinical codelist of SNOMED codes",
      "Patient level data in a csv file",
    ],
    answers: ["Clinical codelist of SNOMED codes"],
  },
  // Question 7
  {
    type: MULTIPLE_CHOICE_KEY,
    heading: "What is considered a safe output?",
    subtext: "Select all that apply.",
    options: [
      "When clear context is given",
      "The output is unreasonably long",
      "Counts under 10 are suppressed and all counts greater than 10 are rounded to the nearest 5",
      "Analytical results that you would expect to see in the public domain",
      "The output contains personally identifiable information",
      "There is undeclared data in a code output",
    ],
    answers: [
      "When clear context is given",
      "Counts under 10 are suppressed and all counts greater than 10 are rounded to the nearest 5",
      "Analytical results that you would expect to see in the public domain",
    ],
  },
  // Question 8
  {
    type: MULTIPLE_CHOICE_KEY,
    heading:
      "Which of the following are unacceptable methods of outputting from the SDE?",
    subtext: "Select all that apply.",
    options: [
      "Taking screenshots of data",
      "Using the Output your Results service",
      "Bypassing the Output your Results service by manually writing down data",
      "Screen sharing with someone who doesn't have access to the SDE",
    ],
    answers: [
      "Taking screenshots of data",
      "Bypassing the Output your Results service by manually writing down data",
      "Screen sharing with someone who doesn't have access to the SDE",
    ],
  },
  // Question 9
  {
    type: SINGLE_CHOICE_KEY,
    heading:
      "There is one writable collaborative database, which enables you to save tables for all colleagues to see and access",
    options: ["True", "False"],
    answers: ["True"],
  },
  // Question 10
  {
    type: MULTIPLE_CHOICE_KEY,
    heading: "Where can SDE users go for help and support?",
    subtext: "Select all that apply.",
    options: [
      "Summary notebooks",
      "Online drop-in sessions",
      "Online guidance",
      "The SDE Service team via email",
    ],
    answers: [
      "Summary notebooks",
      "Online drop-in sessions",
      "Online guidance",
      "The SDE Service team via email",
    ],
  },
];
