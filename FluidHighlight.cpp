#define GLM_ENABLE_EXPERIMENTAL
#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <filesystem>
#include "stb_image.h"

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/quaternion.hpp>
#include <glm/gtx/quaternion.hpp>

#include "E:/CS7GV3/Assignment/Project/imgui-master/imgui-master/imgui.h"
#include "E:/CS7GV3/Assignment/Project/imgui-master/imgui-master/backends/imgui_impl_glfw.h"
#include "E:/CS7GV3/Assignment/Project/imgui-master/imgui-master/backends/imgui_impl_opengl3.h"

#include "shader_m.h"
#include "camera_m.h"
#include "Model.h"

#include <iostream>

void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void mouse_callback(GLFWwindow* window, double xpos, double ypos);
void scroll_callback(GLFWwindow* window, double xoffset, double yoffset);
void processInput(GLFWwindow* window);

// settings
const unsigned int SCR_WIDTH = 1000;
const unsigned int SCR_HEIGHT = 800;

// camera
Camera camera(glm::vec3(0.0f, 0.5f, 5.0f));
float lastX = (float)SCR_WIDTH / 1.0;
float lastY = (float)SCR_HEIGHT / 1.0;
bool firstMouse = true;

// timing
float deltaTime = 0.0f;
float lastFrame = 0.0f;

// Lighting mode (0: No lignting,1: Blinn-Phong, 2: Fluid Hilighting)
int lightingMode = 0;

glm::vec3 highlightAnchor(2.0f, 1.0f, 2.0f); // 默认高光锚点
float highlightRange = 0.0f; // 高光范围
float edgeFeatherStrength = 0.0f; // 边缘柔化强度

// Outline colors
glm::vec3 outlineColorBig = glm::vec3(1.0f, 0.6039f, 0.4471f);   // Big
glm::vec3 outlineColorSmall = glm::vec3(1.0f, 0.4f, 0.48f); // Small
glm::vec3 outlineColorStrawberry = glm::vec3(0.91f, 0.38f, 0.37f); // Strawberry

int main()
{
    // glfw: initialize and configure
    // ------------------------------
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    // glfw window creation
    // --------------------
    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "CartoonRendering", NULL, NULL);
    if (window == NULL)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    glfwSetCursorPosCallback(window, mouse_callback);
    glfwSetScrollCallback(window, scroll_callback);

    // tell GLFW to capture our mouse
    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_NORMAL);

    // glad: load all OpenGL function pointers
    // ---------------------------------------
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    // configure global opengl state
    // -----------------------------
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);

    // 初始化 ImGui
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330 core");
    ImGui::StyleColorsDark();
    ImGui::StyleColorsDark();

    // build and compile shaders
    // -------------------------
    Shader ModelShader("E:/CS7GV3/Assignment/Project/Project/Project/Shader/Model_loading.vert", "E:/CS7GV3/Assignment/Project/Project/Project/Shader/Model_loading.frag");
    Shader outlineShader("E:/CS7GV3/Assignment/Project/Project/Project/Shader/outline.vert", "E:/CS7GV3/Assignment/Project/Project/Project/Shader/outline.frag");
    // load models
    // -----------
    Model BigModel("E:/CS7GV3/Assignment/Project/Project/Texture/strawberry/Big.obj");
    Model SmallModel("E:/CS7GV3/Assignment/Project/Project/Texture/strawberry/Small.obj");
    Model StrawberryModel("E:/CS7GV3/Assignment/Project/Project/Texture/strawberry/Strawberry.obj");

    // render loop
    // -----------
    while (!glfwWindowShouldClose(window))
    {
        // per-frame time logic
        // --------------------
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        // input
        // -----
        processInput(window);

        glClearColor(0.925f, 0.619f, 0.478f, 1.0f); // 设置背景颜色
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glm::mat4 view = camera.GetViewMatrix();
        glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.01f, 500.0f);

        ModelShader.use();

        auto drawModel = [&](Model& model, glm::mat4 transform, glm::vec3 baseColor,
            bool enableLighting = false,
            bool forceVisible = false,
            bool forceHighlightOnTop = false) {

                if (forceHighlightOnTop) {
                    glDisable(GL_DEPTH_TEST); // 强制不被遮挡
                    glDepthMask(GL_FALSE);    // 不写入深度缓冲
                }

            ModelShader.use();
            ModelShader.setMat4("model", transform);
            ModelShader.setMat4("view", view);
            ModelShader.setMat4("projection", projection);
            ModelShader.setInt("lightingMode", enableLighting ? lightingMode : 0);
            if (enableLighting && lightingMode == 1) {
                ModelShader.setVec3("lightPos", glm::vec3(0.0f, 5.0f, 5.0f));
                ModelShader.setVec3("lightColor", glm::vec3(1.0f, 1.0f, 1.0f));
                ModelShader.setVec3("viewPos", camera.Position);
            }        
            ModelShader.setVec3("highlightAnchor", highlightAnchor);
            ModelShader.setFloat("highlightRange", highlightRange);
            ModelShader.setFloat("edgeFeatherStrength", edgeFeatherStrength);
            model.Draw(ModelShader);
            };

        auto drawOutline = [&](Model& model, glm::mat4 transform, glm::vec3 outlineColor) {
            glEnable(GL_CULL_FACE);
            glCullFace(GL_FRONT);
            glEnable(GL_POLYGON_OFFSET_FILL);
            glPolygonOffset(15.0f, 15.0f);

            outlineShader.use();
            outlineShader.setMat4("model", glm::scale(transform, glm::vec3(1.05f)));
            outlineShader.setMat4("view", view);
            outlineShader.setMat4("projection", projection);
            outlineShader.setVec3("outlineColor", outlineColor);
            model.Draw(outlineShader);

            glDisable(GL_POLYGON_OFFSET_FILL);
            glCullFace(GL_BACK);
            glDisable(GL_CULL_FACE);
            };

        glEnable(GL_DEPTH_TEST);
        glDepthMask(GL_TRUE);
        drawModel(BigModel, glm::mat4(1.0f), outlineColorBig, true);

        glDisable(GL_DEPTH_TEST);
        /*drawModel(SmallModel, glm::mat4(1.0f), outlineColorSmall, false);*/
        /*drawModel(StrawberryModel, glm::mat4(1.0f), outlineColorStrawberry, false);*/
        glEnable(GL_DEPTH_TEST);

        glDepthMask(GL_FALSE);
        drawOutline(BigModel, glm::mat4(1.0f), outlineColorBig);
        glDepthMask(GL_TRUE);

        //GUI
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        // 修改默认值为 0（无光照）
        ImGui::Begin("Lighting Settings");
        ImGui::Text("Application average %.3f ms/frame (%.1f FPS)", 1000.0f / ImGui::GetIO().Framerate, ImGui::GetIO().Framerate);
        ImGui::SliderFloat3("Highlight Pos", glm::value_ptr(highlightAnchor), -5.0f, 5.0f);
        ImGui::SliderFloat("Highlight Range", &highlightRange, 0.0f, 0.1f);
        ImGui::SliderFloat("Edge Feather Strength", &edgeFeatherStrength, 0.0f, 2.0f);
        if (ImGui::RadioButton("No Lighting", lightingMode == 0)) lightingMode = 0;
        if (ImGui::RadioButton("Blinn-Phong", lightingMode == 1)) lightingMode = 1;
        if (ImGui::RadioButton("Fluid Highlight", lightingMode == 2)) lightingMode = 2;
        ImGui::End();

        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();
    glfwTerminate();
    return 0;
}

void processInput(GLFWwindow* window) {
    static bool tabPressed = false; // 记录 Tab 是否被按下
    static bool mouseVisible = true; // 记录鼠标是否可见
    static bool ePressed = false;

    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);

    // 摄像机移动控制
    float speedMultiplier = 2.0f;
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
        camera.ProcessKeyboard(FORWARD, deltaTime * speedMultiplier);
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
        camera.ProcessKeyboard(BACKWARD, deltaTime * speedMultiplier);
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
        camera.ProcessKeyboard(LEFT, deltaTime * speedMultiplier);
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
        camera.ProcessKeyboard(RIGHT, deltaTime * speedMultiplier);

    // Tab 键切换鼠标状态
    if (glfwGetKey(window, GLFW_KEY_TAB) == GLFW_PRESS) {
        if (!tabPressed) {
            mouseVisible = !mouseVisible;
            glfwSetInputMode(window, GLFW_CURSOR, mouseVisible ? GLFW_CURSOR_NORMAL : GLFW_CURSOR_DISABLED);
            tabPressed = true;
        }
    }
    else {
        tabPressed = false;
    }

    if (glfwGetKey(window, GLFW_KEY_E) == GLFW_PRESS) {
    if (!ePressed) {
        lightingMode = (lightingMode + 1) % 3; // 支持 0, 1, 2 三种模式
        const char* modeNames[] = { "No Lighting", "Blinn-Phong", "Fluid Highlight" };
        std::cout << "Lighting mode switched to: " << modeNames[lightingMode] << std::endl;
        ePressed = true;
    }
} else {
    ePressed = false;
}
}

// glfw: whenever the window size changed (by OS or user resize) this callback function executes
// ---------------------------------------------------------------------------------------------
void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
    // make sure the viewport matches the new window dimensions; note that width and 
    // height will be significantly larger than specified on retina displays.
    glViewport(0, 0, width, height);
}

// glfw: whenever the mouse moves, this callback is called
// -------------------------------------------------------
void mouse_callback(GLFWwindow* window, double xposIn, double yposIn)
{
    // 检查是否当前鼠标是“隐藏并锁定”状态，只有这种状态下才允许控制摄像机
    int cursorMode = glfwGetInputMode(window, GLFW_CURSOR);
    if (cursorMode != GLFW_CURSOR_DISABLED)
        return;  // 鼠标可见时不处理视角旋转

    float xpos = static_cast<float>(xposIn);
    float ypos = static_cast<float>(yposIn);
    if (firstMouse)
    {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }

    float xoffset = xpos - lastX;
    float yoffset = lastY - ypos; // reversed since y-coordinates go from bottom to top

    lastX = xpos;
    lastY = ypos;

    camera.ProcessMouseMovement(xoffset, yoffset);
}


// glfw: whenever the mouse scroll wheel scrolls, this callback is called
// ----------------------------------------------------------------------
void scroll_callback(GLFWwindow* window, double xoffset, double yoffset)
{
    camera.ProcessMouseScroll(static_cast<float>(yoffset));
}

// utility function for loading a 2D texture from file
// ---------------------------------------------------
unsigned int loadTexture(const char* path) {
    unsigned int textureID;
    glGenTextures(1, &textureID);

    int width, height, nrComponents;
    unsigned char* data = stbi_load(path, &width, &height, &nrComponents, 0);
    if (data) {
        GLenum format = (nrComponents == 3) ? GL_RGB : GL_RGBA;

        glBindTexture(GL_TEXTURE_2D, textureID);
        glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
        glGenerateMipmap(GL_TEXTURE_2D);

        stbi_image_free(data);
    }
    else {
        std::cout << "Texture failed to load at path: " << path << std::endl;
        stbi_image_free(data);
    }
    return textureID;
}

// loads a cubemap texture from 6 individual texture faces
// order:
// +X (right)
// -X (left)
// +Y (top)
// -Y (bottom)
// +Z (front) 
// -Z (back)
// -------------------------------------------------------
unsigned int loadCubemap(vector<std::string> faces)
{
    unsigned int textureID;
    glGenTextures(1, &textureID);
    glBindTexture(GL_TEXTURE_CUBE_MAP, textureID);

    int width, height, nrComponents;
    for (unsigned int i = 0; i < faces.size(); i++)
    {
        unsigned char* data = stbi_load(faces[i].c_str(), &width, &height, &nrComponents, 0);
        if (data)
        {
            glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
            stbi_image_free(data);
        }
        else
        {
            std::cout << "Cubemap texture failed to load at path: " << faces[i] << std::endl;
            stbi_image_free(data);
        }
    }

    return textureID;
}