import { v4 as uuidv4 } from "uuid";

export const helpPageData = [
  {
    id: uuidv4(),
    title: "How to create a Formsly Account",
    content: `
        <p><strong>You have 3 ways to create an account. First, go to <a href='https://formsly.io/sign-up' target="__blank">Sign Up Page</a>.</strong></p>
        <h5>Option 1: Use your email</h5>
        <ol>
            <li>Enter your email, password, and confirm your password.</li>
            <li>Click <strong>Sign Up</strong>.</li>
            <li>To complete creating your account, you need to confirm your email. Check your email inbox and look for Formsly email.</li>
            <li>In the Formsly email, click the "<strong>Confirm your email</strong>" link.</li>
            <li>On the Formsly page, click the "<strong>Go to Formsly</strong>" button at the upper right corner of the page to start your Onboarding process.</li>
        </ol>

        <h5>Option 2: Use your Google account</h5>
        <ol>
            <li>At the bottom of the sign-up form, click the <strong>Google</strong> button.</li>
            <li>You will be redirected to Google and select the account that you want to use.</li>
            <li>If you only have 1 Google account logged in, then you will be redirected back to Formsly.</li>
            <li>On the Formsly page, click the "<strong>Go to Formsly</strong>" button at the upper right corner of the page to start your Onboarding process.</li>
        </ol>

        <h5>Option 3: Use your Azure account</h5>
        <ol>
            <li>Below the Google button, click the <strong>Azure</strong> button.</li>
            <li>On the Azure accounts page, select the account that you want to use.</li>
            <li>After successful Azure login, you will be redirected back to Formsly.</li>
            <li>On the Formsly page, click the "<strong>Go to Formsly</strong>" button at the upper right corner of the page to start your Onboarding process.</li>
        </ol>`,
  },
  {
    id: uuidv4(),
    title: "How to create a Formsly Request",
    content: `
    <p><strong>Creating a Formsly Request</strong></p>
    <ol>
        <li>Start with a form. Choose one from the Form List on the left side of the page.</li>
        <li>Click your chosen form. This will take you to the request creation page.</li>
        <li>Fill in all the required fields on the request page.</li>
        <li>Once you've completed the form, click the <strong>Submit</strong> button at the bottom of the page.</li>
    </ol>
    
    <p><strong>If you can't see the Form List in the Navbar, it's likely due to one of these reasons:</strong></p>
    <ol>
        <li>Your team hasn't created any forms yet.</li>
        <li>You don't have permission to view the forms. If you should have access, contact your team's approver.</li>
    </ol>`,
  },
  {
    id: uuidv4(),
    title: "Team Management",
    content: `
    <p><strong>In your <a target="__blank" href="https://formsly.io/team">Team Page</a>, the team Owner can do the following:</strong></p>

    <h5>Member Management</h5>
    <ol>
        <li>In the Member Management section, search or select the member that you want to update.</li>
        <li>Click the <strong>"Three Dots"</strong> on the right side of the member role.</li>
        <li>You will see the member menu option where you can view member profile, promote/demote member, remove member, and transfer team ownership.</li>
    </ol>

    <h5>Approver List</h5>
    <ol>
        <li>This section makes adding and removing approvers easier.</li>
        <li>To add approvers, click <strong>Add</strong> found on the upper right corner. Then select the members that you want to promote to the approver role.</li>
        <li>To delete/demote an approver, click the <strong>checkbox</strong> next to the approver name. Then click <strong>Remove</strong> found on the upper right corner.</li>
    </ol>

    <h5>Team Groups</h5>
    <ol>
        <li>Team groups are handy when you want to restrict access to a form to only certain groups.</li>
        <li>To add a group, click <strong>Add</strong>, enter the group name in the 'Group Name' field, click <strong>Save</strong>.</li>
        <li>ITo delete groups, check the box next to the group name and click <strong>Remove</strong>.</li>
        <li>To manage members in a group, click the group name, and a section will appear at the bottom of Team Groups for adding or removing members.</li>
    </ol>

    <h5>Team Projects</h5>
    <ol>
        <li>Team projects are for forms that need project information. For example, in Formsly Item Form, members must enter a project name and can select their projects.</li>
        <li>To add a project, click 'Add,' enter the project name in the 'Project Name' field, and click <strong>Save</strong>.</li>
        <li>To delete projects, check the box next to the project name and click <strong>Remove</strong>.</li>
        <li>To manage members in a project, click the project name, and a section will appear at the bottom of Team Projects for adding or removing members.</li>
    </ol>

    <h5>Invite Members</h5>
    <ol>
        <li>To invite a member, scroll down until you see the Invite Member section.</li>
        <li>Then enter the member's email address. You can add multiple email address.</li>
        <li>After adding the email address, click <strong>Invite</strong>.</li>
        <li>Invited members will be sent an email invitation message. You can also Cancel or Resend the invite if needed. Resend invite has a timeout of 1 minute.</li>
    </ol>
    `,
  },
  {
    id: uuidv4(),
    title: "How to add items in the Item Form",
    content: `
    <p><strong>Only members with owner and approver roles can add items.</strong></p>
    <ol>
        <li>Go to <a target="__blank" href="https://formsly.io/team-requests/forms">Forms</a> page.</li>
        <li>Once in the forms page, click <strong>Item</strong>. You will be redirected to the Item Form page.</li>
        <li>To add an item, click <strong>Add</strong> found in the upper right corner of the Items Section.</li>
        <li>Enter all required fields. To add more item descriptions, click the <strong>"Plus Sign"</strong> button at the bottom.</li>
        <li>Once you have confirmed that all item details are correct, click <strong>Save</strong>.</li>
    </ol>

    <p><strong>How to add options in the Item Description</strong></p>
    <ol>
        <li>In the Items Section, click the item that you want to add options.</li>
        <li>A section will appear below containing all the item descriptions.</li>
        <li>In each description, you can add an option by clicking <strong>Add</strong>. To remove an option, check the box next to the option value, and click <strong>Remove</strong>.</li>
    </ol>
    `,
  },
  {
    id: uuidv4(),
    title: "Restrict form access to a specific team group",
    content: `
    <ol>
        <li>Go to <a target="__blank" href="https://formsly.io/team-requests/forms">Forms</a> page.</li>
        <li>On the Forms page, choose a form and click the form name.</li>
        <li>Once in the form page, scroll down to find the "Requester Details" section.</li>
        <li>In the "Select Group" field, pick the groups you want to give access to this form, and then click <strong>Save Changes</strong>.</li>
    </ol>
    `,
  },
  {
    id: uuidv4(),
    title: "Add signers/approvers to a form",
    content: `
    <ol>
        <li>Go to <a target="__blank" href="https://formsly.io/team-requests/forms">Forms</a> page.</li>
        <li>On the Forms page, choose a form and click the form name.</li>
        <li>Once in the form page, scroll down to find the "Default Signer" section.</li>
        <li>To add a signer, click <strong>Add a Signer</strong>, select a signer and action, and click <strong>Done</strong>. You can only select approvers as form signers.</li>
        <li>To delete a signer, click the red <strong>trash icon</strong> found on the left side of the signer.</li>
        <li>You may also specify a signer per project. To do so, scroll down to find the "Signer Per Project" section. Select a project, and add signers.</li>
    </ol>
    `,
  },
];
