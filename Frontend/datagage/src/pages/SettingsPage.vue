<template>
  <div>
    <h1 class="text-h4 mb-4">
      Settings
    </h1>

    <v-card>
      <v-tabs
        v-model="activeTab"
        bg-color="transparent"
      >
        <v-tab value="general">
          General
        </v-tab>
        <v-tab value="appearance">
          Appearance
        </v-tab>
        <v-tab value="qwen">
          Qwen AI
        </v-tab>
        <v-tab value="metabase">
          Metabase
        </v-tab>
        <v-tab value="airbyte">
          Airbyte
        </v-tab>
        <v-tab value="notifications">
          Notifications
        </v-tab>
        <v-tab value="users">
          Users & Permissions
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- General Settings -->
          <v-window-item value="general">
            <h3 class="text-h6 mb-4">
              General Settings
            </h3>

            <v-form
              v-model="generalValid"
              @submit.prevent="saveGeneralSettings"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="generalSettings.appName"
                    label="Application Name"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="generalSettings.timezone"
                    :items="timezones"
                    label="Default Timezone"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="generalSettings.dateFormat"
                    :items="dateFormats"
                    label="Date Format"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="generalSettings.defaultLanguage"
                    :items="languages"
                    label="Default Language"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12">
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving.general"
                  >
                    Save General Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- Appearance Settings -->
          <v-window-item value="appearance">
            <h3 class="text-h6 mb-4">
              Appearance Settings
            </h3>

            <v-form
              v-model="appearanceValid"
              @submit.prevent="saveAppearanceSettings"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-switch
                    v-model="appearanceSettings.darkMode"
                    label="Dark Mode"
                    color="primary"
                    hide-details
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-switch
                    v-model="appearanceSettings.compactMode"
                    label="Compact Mode"
                    color="primary"
                    hide-details
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="appearanceSettings.primaryColor"
                    :items="colorOptions"
                    label="Primary Color"
                    variant="outlined"
                    density="comfortable"
                  >
                    <template #selection="{ item }">
                      <div class="d-flex align-center">
                        <v-avatar
                          size="24"
                          class="mr-2"
                          :style="{ backgroundColor: item.raw.value }"
                        />
                        {{ item.title }}
                      </div>
                    </template>
                    <template #item="{ item, props }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-avatar
                            size="24"
                            class="mr-2"
                            :style="{ backgroundColor: item.raw.value }"
                          />
                        </template>
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="appearanceSettings.density"
                    :items="densityOptions"
                    label="UI Density"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12">
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving.appearance"
                  >
                    Save Appearance Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- Qwen AI Settings -->
          <v-window-item value="qwen">
            <h3 class="text-h6 mb-4">
              Qwen2.5 AI Settings
            </h3>

            <v-form
              v-model="qwenValid"
              @submit.prevent="saveQwenSettings"
            >
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="qwenSettings.apiKey"
                    label="API Key"
                    variant="outlined"
                    density="comfortable"
                    type="password"
                    :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
                    :type="showApiKey ? 'text' : 'password'"
                    @click:append-inner="showApiKey = !showApiKey"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="qwenSettings.apiEndpoint"
                    label="API Endpoint"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="qwenSettings.model"
                    label="Model Version"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-slider
                    v-model="qwenSettings.temperature"
                    label="Temperature"
                    min="0"
                    max="2"
                    step="0.1"
                    thumb-label
                    ticks
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-slider
                    v-model="qwenSettings.topP"
                    label="Top P"
                    min="0"
                    max="1"
                    step="0.05"
                    thumb-label
                    ticks
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="qwenSettings.maxTokens"
                    label="Max Tokens"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="qwenSettings.systemPrompt"
                    label="Default System Prompt"
                    variant="outlined"
                    rows="4"
                    hint="Define the default behavior and context for Qwen2.5"
                  />
                </v-col>

                <v-col cols="12">
                  <v-btn
                    color="primary"
                    :loading="testing.qwen"
                    class="mr-2"
                    @click="testQwenConnection"
                  >
                    Test Connection
                  </v-btn>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving.qwen"
                  >
                    Save Qwen Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- Metabase Settings -->
          <v-window-item value="metabase">
            <h3 class="text-h6 mb-4">
              Metabase Integration Settings
            </h3>

            <v-form
              v-model="metabaseValid"
              @submit.prevent="saveMetabaseSettings"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="metabaseSettings.url"
                    label="Metabase URL"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="metabaseSettings.username"
                    label="Username"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="metabaseSettings.password"
                    label="Password"
                    variant="outlined"
                    density="comfortable"
                    type="password"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="metabaseSettings.sessionToken"
                    label="Session Token"
                    variant="outlined"
                    density="comfortable"
                    disabled
                  />
                </v-col>

                <v-col cols="12">
                  <v-btn
                    color="primary"
                    :loading="testing.metabase"
                    class="mr-2"
                    @click="getMetabaseSessionToken"
                  >
                    Get Session Token
                  </v-btn>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving.metabase"
                  >
                    Save Metabase Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- Airbyte Settings -->
          <v-window-item value="airbyte">
            <h3 class="text-h6 mb-4">
              Airbyte Integration Settings
            </h3>

            <v-form
              v-model="airbyteValid"
              @submit.prevent="saveAirbyteSettings"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="airbyteSettings.url"
                    label="Airbyte URL"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="airbyteSettings.username"
                    label="Username"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="airbyteSettings.password"
                    label="Password"
                    variant="outlined"
                    density="comfortable"
                    type="password"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="airbyteSettings.apiKey"
                    label="API Key"
                    variant="outlined"
                    density="comfortable"
                    type="password"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="airbyteSettings.workspaceId"
                    label="Workspace ID"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12">
                  <v-btn
                    color="primary"
                    :loading="testing.airbyte"
                    class="mr-2"
                    @click="testAirbyteConnection"
                  >
                    Test Connection
                  </v-btn>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving.airbyte"
                  >
                    Save Airbyte Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- Notifications Settings -->
          <v-window-item value="notifications">
            <h3 class="text-h6 mb-4">
              Notification Settings
            </h3>

            <v-form
              v-model="notificationsValid"
              @submit.prevent="saveNotificationSettings"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-switch
                    v-model="notificationSettings.emailEnabled"
                    label="Email Notifications"
                    color="primary"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-switch
                    v-model="notificationSettings.slackEnabled"
                    label="Slack Notifications"
                    color="primary"
                  />
                </v-col>

                <v-col
                  v-if="notificationSettings.emailEnabled"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="notificationSettings.smtpHost"
                    label="SMTP Host"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  v-if="notificationSettings.emailEnabled"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="notificationSettings.smtpPort"
                    label="SMTP Port"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                  />
                </v-col>

                <v-col
                  v-if="notificationSettings.emailEnabled"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="notificationSettings.smtpUsername"
                    label="SMTP Username"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  v-if="notificationSettings.emailEnabled"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="notificationSettings.smtpPassword"
                    label="SMTP Password"
                    variant="outlined"
                    density="comfortable"
                    type="password"
                  />
                </v-col>

                <v-col
                  v-if="notificationSettings.slackEnabled"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="notificationSettings.slackWebhook"
                    label="Slack Webhook URL"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col
                  v-if="notificationSettings.slackEnabled"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="notificationSettings.slackChannel"
                    label="Slack Channel"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>

                <v-col cols="12">
                  <h4 class="text-subtitle-1 mb-2">
                    Notification Events
                  </h4>
                  <v-checkbox
                    v-model="notificationSettings.events.dataSourceChanged"
                    label="Data Source Changes"
                    color="primary"
                    hide-details
                    class="mb-2"
                  />
                  <v-checkbox
                    v-model="notificationSettings.events.insightCreated"
                    label="New Insight Created"
                    color="primary"
                    hide-details
                    class="mb-2"
                  />
                  <v-checkbox
                    v-model="notificationSettings.events.pipelineFailure"
                    label="Pipeline Failures"
                    color="primary"
                    hide-details
                    class="mb-2"
                  />
                  <v-checkbox
                    v-model="notificationSettings.events.systemUpdates"
                    label="System Updates"
                    color="primary"
                    hide-details
                    class="mb-2"
                  />
                </v-col>

                <v-col cols="12">
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving.notifications"
                  >
                    Save Notification Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- Users & Permissions -->
          <v-window-item value="users">
            <h3 class="text-h6 mb-4">
              Users & Permissions
            </h3>

            <v-row>
              <v-col
                cols="12"
                class="d-flex justify-space-between align-center"
              >
                <div>
                  <span class="text-subtitle-1">User Management</span>
                </div>
                <v-btn
                  color="primary"
                  prepend-icon="mdi-account-plus"
                  @click="openNewUserDialog"
                >
                  Add User
                </v-btn>
              </v-col>

              <v-col cols="12">
                <v-data-table
                  :headers="userHeaders"
                  :items="users"
                  :items-per-page="5"
                  class="elevation-1"
                >
                  <template #item.role="{ item }">
                    <v-chip
                      :color="getRoleColor(item.role)"
                      size="small"
                    >
                      {{ item.role }}
                    </v-chip>
                  </template>

                  <template #item.status="{ item }">
                    <v-chip
                      :color="item.status === 'Active' ? 'success' : 'error'"
                      size="small"
                    >
                      {{ item.status }}
                    </v-chip>
                  </template>

                  <template #item.actions="{ item }">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="editUser(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="confirmDeleteUser(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>

              <v-col
                cols="12"
                class="mt-6"
              >
                <div class="d-flex justify-space-between align-center mb-4">
                  <span class="text-subtitle-1">Role Management</span>
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-shield-plus"
                    @click="openNewRoleDialog"
                  >
                    Add Role
                  </v-btn>
                </div>

                <v-data-table
                  :headers="roleHeaders"
                  :items="roles"
                  :items-per-page="5"
                  class="elevation-1"
                >
                  <template #item.actions="{ item }">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="editRole(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      :disabled="item.name === 'Admin' || item.name === 'User'"
                      @click="confirmDeleteRole(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- User Dialog -->
    <v-dialog
      v-model="userDialog"
      max-width="600"
    >
      <v-card>
        <v-card-title>
          {{ isEditingUser ? "Edit User" : "Add New User" }}
        </v-card-title>

        <v-card-text>
          <v-form
            ref="userForm"
            v-model="userFormValid"
          >
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentUser.fullName"
                  label="Full Name"
                  required
                  :rules="[(v) => !!v || 'Name is required']"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentUser.email"
                  label="Email"
                  required
                  :rules="[
                    (v) => !!v || 'Email is required',
                    (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
                  ]"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="currentUser.role"
                  :items="roles.map((role) => role.name)"
                  label="Role"
                  required
                  :rules="[(v) => !!v || 'Role is required']"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="currentUser.status"
                  :items="['Active', 'Inactive']"
                  label="Status"
                  required
                />
              </v-col>

              <v-col
                v-if="!isEditingUser"
                cols="12"
              >
                <v-text-field
                  v-model="currentUser.password"
                  label="Password"
                  type="password"
                  required
                  :rules="[
                    (v) => !!v || 'Password is required',
                    (v) =>
                      v.length >= 8 || 'Password must be at least 8 characters',
                  ]"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="userDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!userFormValid"
            :loading="saving.user"
            @click="saveUser"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role Dialog -->
    <v-dialog
      v-model="roleDialog"
      max-width="700"
    >
      <v-card>
        <v-card-title>
          {{ isEditingRole ? "Edit Role" : "Add New Role" }}
        </v-card-title>

        <v-card-text>
          <v-form
            ref="roleForm"
            v-model="roleFormValid"
          >
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentRole.name"
                  label="Role Name"
                  required
                  :rules="[(v) => !!v || 'Role name is required']"
                  :disabled="
                    isEditingRole &&
                      (currentRole.name === 'Admin' ||
                        currentRole.name === 'User')
                  "
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="currentRole.description"
                  label="Description"
                />
              </v-col>

              <v-col cols="12">
                <h4 class="text-subtitle-1 mb-2">
                  Permissions
                </h4>

                <v-row>
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-card
                      variant="outlined"
                      class="pa-3 mb-3"
                    >
                      <div class="text-subtitle-2 mb-2">
                        Data Sources
                      </div>
                      <v-checkbox
                        v-model="currentRole.permissions.datasources.view"
                        label="View Data Sources"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.datasources.create"
                        label="Create Data Sources"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.datasources.edit"
                        label="Edit Data Sources"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.datasources.delete"
                        label="Delete Data Sources"
                        hide-details
                      />
                    </v-card>
                  </v-col>

                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-card
                      variant="outlined"
                      class="pa-3 mb-3"
                    >
                      <div class="text-subtitle-2 mb-2">
                        Insights
                      </div>
                      <v-checkbox
                        v-model="currentRole.permissions.insights.view"
                        label="View Insights"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.insights.create"
                        label="Create Insights"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.insights.edit"
                        label="Edit Insights"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.insights.delete"
                        label="Delete Insights"
                        hide-details
                      />
                    </v-card>
                  </v-col>

                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-card
                      variant="outlined"
                      class="pa-3 mb-3"
                    >
                      <div class="text-subtitle-2 mb-2">
                        Dashboard
                      </div>
                      <v-checkbox
                        v-model="currentRole.permissions.dashboard.view"
                        label="View Dashboard"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.dashboard.customize"
                        label="Customize Dashboard"
                        hide-details
                      />
                    </v-card>
                  </v-col>

                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-card
                      variant="outlined"
                      class="pa-3 mb-3"
                    >
                      <div class="text-subtitle-2 mb-2">
                        Settings
                      </div>
                      <v-checkbox
                        v-model="currentRole.permissions.settings.view"
                        label="View Settings"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.settings.edit"
                        label="Edit Settings"
                        hide-details
                        class="mb-1"
                      />
                      <v-checkbox
                        v-model="currentRole.permissions.settings.manageUsers"
                        label="Manage Users"
                        hide-details
                      />
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="roleDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!roleFormValid"
            :loading="saving.role"
            @click="saveRole"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete User Confirmation Dialog -->
    <v-dialog
      v-model="deleteUserDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Delete User</v-card-title>
        <v-card-text>
          Are you sure you want to delete the user "{{
            userToDelete?.fullName
          }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="deleteUserDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting.user"
            @click="deleteUser"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Role Confirmation Dialog -->
    <v-dialog
      v-model="deleteRoleDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Delete Role</v-card-title>
        <v-card-text>
          Are you sure you want to delete the role "{{ roleToDelete?.name }}"?
          Users with this role will need to be reassigned. This action cannot be
          undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="deleteRoleDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting.role"
            @click="deleteRole"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

// Active tab
const activeTab = ref("general");

// Form validation
const generalValid = ref(true);
const appearanceValid = ref(true);
const qwenValid = ref(true);
const metabaseValid = ref(true);
const airbyteValid = ref(true);
const notificationsValid = ref(true);
const userFormValid = ref(true);
const roleFormValid = ref(true);

// Dialog controls
const userDialog = ref(false);
const roleDialog = ref(false);
const deleteUserDialog = ref(false);
const deleteRoleDialog = ref(false);
const isEditingUser = ref(false);
const isEditingRole = ref(false);
const userToDelete = ref(null);
const roleToDelete = ref(null);
const showApiKey = ref(false);

// Loading states
const saving = reactive({
  general: false,
  appearance: false,
  qwen: false,
  metabase: false,
  airbyte: false,
  notifications: false,
  user: false,
  role: false,
});

const testing = reactive({
  qwen: false,
  metabase: false,
  airbyte: false,
});

const deleting = reactive({
  user: false,
  role: false,
});

// General settings
const generalSettings = ref({
  appName: "Qwen2.5 Data Visualization",
  timezone: "UTC",
  dateFormat: "YYYY-MM-DD",
  defaultLanguage: "en-US",
});

// Appearance settings
const appearanceSettings = ref({
  darkMode: true,
  compactMode: false,
  primaryColor: "#1976D2",
  density: "Default",
});

// Qwen settings
const qwenSettings = ref({
  apiKey: "",
  apiEndpoint: "https://api.example.com/v1",
  model: "Qwen2.5-72B-Instruct",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  systemPrompt:
    "You are Qwen2.5, an AI assistant helping to analyze data and generate insights.",
});

// Metabase settings
const metabaseSettings = ref({
  url: "http://localhost:3000",
  username: "admin@example.com",
  password: "",
  sessionToken: "",
});

// Airbyte settings
const airbyteSettings = ref({
  url: "http://localhost:8000",
  username: "airbyte",
  password: "",
  apiKey: "",
  workspaceId: "",
});

// Notification settings
const notificationSettings = ref({
  emailEnabled: false,
  slackEnabled: false,
  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  slackWebhook: "",
  slackChannel: "#notifications",
  events: {
    dataSourceChanged: true,
    insightCreated: true,
    pipelineFailure: true,
    systemUpdates: false,
  },
});

// Current user & role (for edit/create dialogs)
const currentUser = ref({
  id: null,
  fullName: "",
  email: "",
  role: "User",
  status: "Active",
  password: "",
});

const currentRole = ref({
  id: null,
  name: "",
  description: "",
  permissions: {
    datasources: {
      view: true,
      create: false,
      edit: false,
      delete: false,
    },
    insights: {
      view: true,
      create: false,
      edit: false,
      delete: false,
    },
    dashboard: {
      view: true,
      customize: false,
    },
    settings: {
      view: false,
      edit: false,
      manageUsers: false,
    },
  },
});

// Sample data
const users = ref([
  {
    id: 1,
    fullName: "Admin User",
    email: "admin@example.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2024-02-27 15:45",
  },
  {
    id: 2,
    fullName: "John Doe",
    email: "john@example.com",
    role: "Analyst",
    status: "Active",
    lastLogin: "2024-02-26 10:30",
  },
  {
    id: 3,
    fullName: "Jane Smith",
    email: "jane@example.com",
    role: "User",
    status: "Active",
    lastLogin: "2024-02-25 14:20",
  },
  {
    id: 4,
    fullName: "Tom Wilson",
    email: "tom@example.com",
    role: "User",
    status: "Inactive",
    lastLogin: "2024-01-15 09:10",
  },
]);

const roles = ref([
  {
    id: 1,
    name: "Admin",
    description: "Full administrative access",
    permissions: {
      datasources: { view: true, create: true, edit: true, delete: true },
      insights: { view: true, create: true, edit: true, delete: true },
      dashboard: { view: true, customize: true },
      settings: { view: true, edit: true, manageUsers: true },
    },
  },
  {
    id: 2,
    name: "Analyst",
    description: "Can manage data sources and create insights",
    permissions: {
      datasources: { view: true, create: true, edit: true, delete: false },
      insights: { view: true, create: true, edit: true, delete: true },
      dashboard: { view: true, customize: true },
      settings: { view: true, edit: false, manageUsers: false },
    },
  },
  {
    id: 3,
    name: "User",
    description: "Regular user with limited permissions",
    permissions: {
      datasources: { view: true, create: false, edit: false, delete: false },
      insights: { view: true, create: false, edit: false, delete: false },
      dashboard: { view: true, customize: false },
      settings: { view: false, edit: false, manageUsers: false },
    },
  },
]);

const userHeaders = [
  { title: "Name", key: "fullName" },
  { title: "Email", key: "email" },
  { title: "Role", key: "role" },
  { title: "Status", key: "status" },
  { title: "Last Login", key: "lastLogin" },
  { title: "Actions", key: "actions", sortable: false },
];

const roleHeaders = [
  { title: "Role Name", key: "name" },
  { title: "Description", key: "description" },
  { title: "Actions", key: "actions", sortable: false },
];

// Options for select menus
const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const dateFormats = ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "MMM D, YYYY"];

const languages = ["en-US", "es-ES", "fr-FR", "de-DE", "ja-JP", "zh-CN"];

const colorOptions = [
  { title: "Blue", value: "#1976D2" },
  { title: "Purple", value: "#6200EA" },
  { title: "Green", value: "#2E7D32" },
  { title: "Red", value: "#D32F2F" },
  { title: "Orange", value: "#E64A19" },
  { title: "Teal", value: "#00796B" },
];

const densityOptions = ["Default", "Comfortable", "Compact"];

// Methods
const saveGeneralSettings = async () => {
  saving.general = true;

  try {
    // In a real app, we'd save the settings via API
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Show success message
    alert("General settings saved successfully");
  } catch (error) {
    console.error("Error saving general settings:", error);
    alert("Failed to save general settings");
  } finally {
    saving.general = false;
  }
};

const saveAppearanceSettings = async () => {
  saving.appearance = true;

  try {
    // In a real app, we'd save the settings via API
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Show success message
    alert("Appearance settings saved successfully");
  } catch (error) {
    console.error("Error saving appearance settings:", error);
    alert("Failed to save appearance settings");
  } finally {
    saving.appearance = false;
  }
};

const saveQwenSettings = async () => {
  saving.qwen = true;

  try {
    // In a real app, we'd save the settings via API
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Show success message
    alert("Qwen2.5 settings saved successfully");
  } catch (error) {
    console.error("Error saving Qwen settings:", error);
    alert("Failed to save Qwen settings");
  } finally {
    saving.qwen = false;
  }
};

const saveMetabaseSettings = async () => {
  saving.metabase = true;

  try {
    // In a real app, we'd save the settings via API
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Show success message
    alert("Metabase settings saved successfully");
  } catch (error) {
    console.error("Error saving Metabase settings:", error);
    alert("Failed to save Metabase settings");
  } finally {
    saving.metabase = false;
  }
};

const saveAirbyteSettings = async () => {
  saving.airbyte = true;

  try {
    // In a real app, we'd save the settings via API
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Show success message
    alert("Airbyte settings saved successfully");
  } catch (error) {
    console.error("Error saving Airbyte settings:", error);
    alert("Failed to save Airbyte settings");
  } finally {
    saving.airbyte = false;
  }
};

const saveNotificationSettings = async () => {
  saving.notifications = true;

  try {
    // In a real app, we'd save the settings via API
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Show success message
    alert("Notification settings saved successfully");
  } catch (error) {
    console.error("Error saving notification settings:", error);
    alert("Failed to save notification settings");
  } finally {
    saving.notifications = false;
  }
};

const testQwenConnection = async () => {
  testing.qwen = true;

  try {
    // In a real app, we'd test the connection via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Show success message
    alert("Qwen2.5 connection successful");
  } catch (error) {
    console.error("Error testing Qwen connection:", error);
    alert("Failed to connect to Qwen2.5 API");
  } finally {
    testing.qwen = false;
  }
};

const getMetabaseSessionToken = async () => {
  testing.metabase = true;

  try {
    // In a real app, we'd get a session token via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Simulate getting a token
    metabaseSettings.value.sessionToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
    // Show success message
    alert("Metabase session token retrieved successfully");
  } catch (error) {
    console.error("Error getting Metabase session token:", error);
    alert("Failed to get Metabase session token");
  } finally {
    testing.metabase = false;
  }
};

const testAirbyteConnection = async () => {
  testing.airbyte = true;

  try {
    // In a real app, we'd test the connection via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Show success message
    alert("Airbyte connection successful");
  } catch (error) {
    console.error("Error testing Airbyte connection:", error);
    alert("Failed to connect to Airbyte API");
  } finally {
    testing.airbyte = false;
  }
};

const getRoleColor = (role) => {
  const colors = {
    Admin: "error",
    Analyst: "primary",
    User: "success",
  };

  return colors[role] || "grey";
};

const openNewUserDialog = () => {
  isEditingUser.value = false;
  currentUser.value = {
    id: null,
    fullName: "",
    email: "",
    role: "User",
    status: "Active",
    password: "",
  };
  userDialog.value = true;
};

const editUser = (user) => {
  isEditingUser.value = true;
  currentUser.value = { ...user, password: "" };
  userDialog.value = true;
};

const confirmDeleteUser = (user) => {
  userToDelete.value = user;
  deleteUserDialog.value = true;
};

const saveUser = async () => {
  saving.user = true;

  try {
    // In a real app, we'd save the user via API
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (isEditingUser.value) {
      // Update existing user
      const index = users.value.findIndex((u) => u.id === currentUser.value.id);
      if (index !== -1) {
        users.value[index] = { ...currentUser.value, password: undefined };
      }
    } else {
      // Create new user
      const newId = users.value.length + 1;
      users.value.push({
        ...currentUser.value,
        id: newId,
        password: undefined,
        lastLogin: "Never",
      });
    }

    userDialog.value = false;
  } catch (error) {
    console.error("Error saving user:", error);
    alert("Failed to save user");
  } finally {
    saving.user = false;
  }
};

const deleteUser = async () => {
  deleting.user = true;

  try {
    // In a real app, we'd delete the user via API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Remove from list
    users.value = users.value.filter((u) => u.id !== userToDelete.value.id);

    deleteUserDialog.value = false;
    userToDelete.value = null;
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Failed to delete user");
  } finally {
    deleting.user = false;
  }
};

const openNewRoleDialog = () => {
  isEditingRole.value = false;
  currentRole.value = {
    id: null,
    name: "",
    description: "",
    permissions: {
      datasources: {
        view: true,
        create: false,
        edit: false,
        delete: false,
      },
      insights: {
        view: true,
        create: false,
        edit: false,
        delete: false,
      },
      dashboard: {
        view: true,
        customize: false,
      },
      settings: {
        view: false,
        edit: false,
        manageUsers: false,
      },
    },
  };
  roleDialog.value = true;
};

const editRole = (role) => {
  isEditingRole.value = true;
  currentRole.value = JSON.parse(JSON.stringify(role)); // Deep copy
  roleDialog.value = true;
};

const confirmDeleteRole = (role) => {
  roleToDelete.value = role;
  deleteRoleDialog.value = true;
};

const saveRole = async () => {
  saving.role = true;

  try {
    // In a real app, we'd save the role via API
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (isEditingRole.value) {
      // Update existing role
      const index = roles.value.findIndex((r) => r.id === currentRole.value.id);
      if (index !== -1) {
        roles.value[index] = { ...currentRole.value };
      }
    } else {
      // Create new role
      const newId = roles.value.length + 1;
      roles.value.push({
        ...currentRole.value,
        id: newId,
      });
    }

    roleDialog.value = false;
  } catch (error) {
    console.error("Error saving role:", error);
    alert("Failed to save role");
  } finally {
    saving.role = false;
  }
};

const deleteRole = async () => {
  deleting.role = true;

  try {
    // In a real app, we'd delete the role via API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Remove from list
    roles.value = roles.value.filter((r) => r.id !== roleToDelete.value.id);

    deleteRoleDialog.value = false;
    roleToDelete.value = null;
  } catch (error) {
    console.error("Error deleting role:", error);
    alert("Failed to delete role");
  } finally {
    deleting.role = false;
  }
};
</script>
